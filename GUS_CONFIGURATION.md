# Konfiguracja GUS BIR1.1

Klucza produkcyjnego nie zapisuj w kodzie ani w repozytorium.
Backend odczytuje go ze zmiennej środowiskowej:

```text
GUS_BIR_API_KEY=a548f908257a4b8f8500
```

Opcjonalnie można nadpisać adres usługi:

```text
GUS_BIR_ENDPOINT=https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc
```

Przykład w `docker-compose.yml` dla kontenera backendu:

```yaml
environment:
  GUS_BIR_API_KEY: ${GUS_BIR_API_KEY}
  GUS_BIR_ENDPOINT: https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc
```

A w pliku `.env`, którego nie należy commitować:

```text
GUS_BIR_API_KEY=...
```

Endpoint aplikacji:

```text
GET /api/gus/by-nip/{nip}
```

Zwracane pola: `nip`, `name`, `streetNo`, `zipCode`, `city`.
