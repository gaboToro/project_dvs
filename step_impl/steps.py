import os
import requests
from behave import step

_state = {}
BASE_URL = os.getenv("BASE_URL", "").rstrip("/")

def _url(path: str) -> str:
    return f"{BASE_URL}{path}"

@step("el sistema está disponible")
def sistema_disponible(context):
    r = requests.get(BASE_URL, timeout=15)
    _state["response"] = r

@step('hago POST a "{path}" con credenciales válidas')
def login_ok(context, path):
    r = requests.post(
        _url(path),
        json={"username": "admin", "password": "admin"},
        timeout=20
    )
    _state["response"] = r

@step('hago POST a "{path}" con credenciales inválidas')
def login_bad(context, path):
    r = requests.post(
        _url(path),
        json={"username": "admin", "password": "incorrecta"},
        timeout=20
    )
    _state["response"] = r

@step("la respuesta debe ser {code}")
def validar_respuesta(context, code):
    r = _state["response"]
    assert r.status_code == int(code), \
        f"Esperaba {code}, llegó {r.status_code}. Body: {r.text[:200]}"
