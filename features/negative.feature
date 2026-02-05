Feature: Login API Negativo

  Scenario: Credenciales incorrectas
    Given el sistema está disponible
    When hago POST a "/api/auth/login" con credenciales inválidas
    Then la respuesta debe ser 401
