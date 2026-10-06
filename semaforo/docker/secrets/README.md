# Segredos

Nada aqui é versionado. Crie os dois arquivos antes do primeiro `docker compose up`:

```bash
openssl rand -hex 32 | tr -d '\n' > db_password
printf 'postgres://semaforo_app:%s@postgres:5432/semaforo' "$(cat db_password)" > database_url
chmod 600 db_password database_url
```

O `tr -d '\n'` importa: uma quebra de linha no fim vira parte da senha e o
Postgres recusa a conexão com uma mensagem que não ajuda em nada. A senha em
hexadecimal evita `/`, `+` e `=`, que precisariam de escape dentro da URL.
