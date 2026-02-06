Feature: Login API

  Scenario: Login exitoso
    Given el sistema está disponible
    When hago POST a "/api/auth/login" con credenciales válidas
    Then la respuesta debe ser 200
