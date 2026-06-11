#!/bin/bash
# init.sh — Verificación de que el proyecto funciona
# Si algo falla (exit > 0), el agente NO debe continuar hasta resolverlo.
# Adaptado para proyectos web y apps (Node/React/Next + Python/FastAPI).

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fallback to python if python3 is not working (e.g. on Windows)
if ! command -v python3 >/dev/null 2>&1 || ! python3 --version >/dev/null 2>&1; then
  python3() {
    python "$@"
  }
fi

ERRORS=0
WARNINGS=0

ok()   { echo -e " ${GREEN}✓${NC} $1"; }
fail() { echo -e " ${RED}✗ $1${NC}"; ERRORS=$((ERRORS + 1)); }
warn() { echo -e " ${YELLOW}⚠${NC} $1"; WARNINGS=$((WARNINGS + 1)); }
info() { echo -e " ${BLUE}·${NC} $1"; }

echo ""
echo "============================================"
echo " VERIFICACIÓN DEL ENTORNO"
echo "============================================"

# ---------- Archivos críticos del harness ----------
echo ""
echo "[ Harness ]"
[ -f "CLAUDE.md" ]    && ok "CLAUDE.md presente"    || fail "CLAUDE.md no encontrado"
[ -f "SESSION.md" ]   && ok "SESSION.md presente"   || fail "SESSION.md no encontrado"
[ -f "TASKS.json" ]   && ok "TASKS.json presente"   || fail "TASKS.json no encontrado"
[ -f ".claudeignore" ] && ok ".claudeignore presente" || warn ".claudeignore no encontrado"

# Validar TASKS.json como JSON válido (node preferido; python fallback; si no hay ninguno, aviso)
if [ -f "TASKS.json" ]; then
  if command -v node >/dev/null 2>&1; then
    if node -e "JSON.parse(require('fs').readFileSync('TASKS.json','utf8'))" 2>/dev/null; then
      ok "TASKS.json es JSON válido"
    else
      fail "TASKS.json tiene errores de sintaxis"
    fi
  elif command -v python3 >/dev/null 2>&1 || command -v python >/dev/null 2>&1; then
    if python3 -c "import json; json.load(open('TASKS.json'))" 2>/dev/null; then
      ok "TASKS.json es JSON válido"
    else
      fail "TASKS.json tiene errores de sintaxis"
    fi
  else
    warn "Sin node ni python en PATH para validar TASKS.json — comprobación omitida"
  fi
fi

# ---------- Dependencias Node ----------
echo ""
echo "[ Dependencias Node ]"
if [ -f "package.json" ]; then
  if [ -d "node_modules" ]; then
    ok "node_modules instalado"
  else
    warn "node_modules no encontrado — instalando..."
    if command -v yarn >/dev/null 2>&1 && [ -f "yarn.lock" ]; then
      yarn install --silent && ok "Dependencias instaladas con yarn" || fail "Error con yarn install"
    else
      npm install --silent && ok "Dependencias instaladas con npm" || fail "Error con npm install"
    fi
  fi
else
  info "Sin package.json — proyecto no usa Node"
fi

# ---------- Dependencias Python ----------
echo ""
echo "[ Dependencias Python ]"
if [ -f "requirements.txt" ]; then
  MISSING_PY=0
  while IFS= read -r line; do
    [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue
    PKG=$(echo "$line" | sed 's/[<>=!].*//' | tr -d ' ')
    if ! python3 -c "import importlib.util; exit(0 if importlib.util.find_spec('$PKG') else 1)" 2>/dev/null; then
      MISSING_PY=$((MISSING_PY + 1))
    fi
  done < "requirements.txt"

  if [ $MISSING_PY -eq 0 ]; then
    ok "Dependencias Python instaladas"
  else
    warn "$MISSING_PY paquete(s) Python faltante(s) — instalando..."
    pip install -r requirements.txt --quiet && ok "Instaladas" || fail "Error al instalar"
  fi
else
  info "Sin requirements.txt — proyecto no usa Python"
fi

# ---------- Variables de entorno ----------
echo ""
echo "[ Variables de entorno ]"
if [ -f ".env" ]; then
  ok ".env encontrado"

  if [ -f ".env.example" ]; then
    MISSING=0
    while IFS= read -r line; do
      line="${line%$'\r'}"  # strip Windows CRLF
      [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue
      KEY=$(echo "$line" | cut -d'=' -f1 | tr -d ' ')
      if ! grep -q "^${KEY}=" .env 2>/dev/null; then
        fail "Variable faltante en .env: $KEY"
        MISSING=$((MISSING + 1))
      fi
    done < ".env.example"
    [ $MISSING -eq 0 ] && ok "Todas las variables del .env.example están definidas"
  else
    warn "No hay .env.example — crea uno con las claves necesarias (sin valores)"
  fi
elif [ -f ".env.example" ]; then
  fail ".env no encontrado — créalo basándote en .env.example"
else
  info "No se detectó configuración de .env (puede ser intencional)"
fi

# ---------- Sintaxis ----------
echo ""
echo "[ Sintaxis básica ]"
if [ -f "package.json" ]; then
  MAIN=$(node -e "const p=require('./package.json'); console.log(p.main||'index.js')" 2>/dev/null || echo "index.js")
  if [ -f "$MAIN" ]; then
    node --check "$MAIN" 2>/dev/null && ok "Sintaxis correcta en $MAIN" || fail "Error de sintaxis en $MAIN"
  fi
fi

if [ -f "main.py" ]; then
  python3 -m py_compile main.py 2>/dev/null && ok "Sintaxis correcta en main.py" || fail "Error de sintaxis en main.py"
fi

if [ -f "server.py" ]; then
  python3 -m py_compile server.py 2>/dev/null && ok "Sintaxis correcta en server.py" || fail "Error de sintaxis en server.py"
fi

# ---------- Tests ----------
echo ""
echo "[ Tests ]"
TESTS_RAN=false

if [ -f "package.json" ] && node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts.test ? 0 : 1)" 2>/dev/null; then
  npm test --silent 2>/dev/null && ok "Tests Node pasan" || fail "Tests Node fallan — revisar antes de continuar"
  TESTS_RAN=true
fi

if [ -f "pytest.ini" ] || [ -f "pyproject.toml" ] || [ -d "tests" ]; then
  python3 -m pytest --quiet 2>/dev/null && ok "Tests Python pasan" || warn "Tests Python no pasan o no hay tests todavía"
  TESTS_RAN=true
fi

[ "$TESTS_RAN" = false ] && info "No se encontraron tests configurados"

# ---------- Resumen ----------
echo ""
echo "============================================"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e " ${GREEN}Proyecto listo.${NC}"
elif [ $ERRORS -eq 0 ]; then
  echo -e " ${YELLOW}Listo con $WARNINGS aviso(s).${NC}"
else
  echo -e " ${RED}$ERRORS error(es). El agente no debe continuar.${NC}"
fi
echo "============================================"
echo ""

exit $ERRORS
