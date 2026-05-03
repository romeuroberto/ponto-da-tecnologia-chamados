# Fluxos do Sistema

## 1. Fluxo de abertura de chamado

1. Usuario acessa o sistema.
2. Usuario seleciona o cliente.
3. Usuario informa titulo, descricao, categoria e prioridade.
4. Sistema gera numero unico do chamado.
5. Sistema registra data de abertura e autor.
6. Chamado entra com status `aberto`.

## 2. Fluxo de triagem

1. Atendente visualiza chamados abertos.
2. Atendente valida informacoes do chamado.
3. Atendente define ou ajusta prioridade.
4. Atendente atribui o chamado a um responsavel.
5. Status muda para `em atendimento`, quando aplicavel.

## 3. Fluxo de atendimento

1. Tecnico acessa os chamados sob sua responsabilidade.
2. Tecnico registra analise, tratativas e atualizacoes.
3. Caso precise de retorno do cliente, o status muda para `aguardando cliente`.
4. Ao solucionar o problema, o tecnico marca como `resolvido`.

## 4. Fluxo de encerramento

1. Chamado resolvido e revisado.
2. Usuario autorizado registra encerramento.
3. Sistema grava data e autor do encerramento.
4. Status muda para `encerrado`.

## 5. Fluxo de reabertura

1. Usuario autorizado localiza chamado encerrado ou resolvido.
2. Usuario informa motivo da reabertura.
3. Sistema registra evento no historico.
4. Status retorna para `aberto` ou `em atendimento`, conforme regra adotada.

## 6. Fluxo de consulta

1. Usuario acessa painel ou listagem.
2. Aplica filtros por cliente, status, prioridade, tecnico e periodo.
3. Sistema retorna os chamados correspondentes.
4. Usuario acessa detalhes e historico quando necessario.
