Feature: Smoke

  Scenario: Sistema disponible
    Given el sistema está disponible
    Then la respuesta debe ser 200
