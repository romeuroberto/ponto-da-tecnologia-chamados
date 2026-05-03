# Criterios de Aceite

## CA-01 - Abertura de chamado

Um chamado sera considerado corretamente aberto quando:

- estiver vinculado a um cliente existente
- possuir titulo e descricao
- possuir prioridade definida
- receber numero unico automaticamente
- iniciar com status valido

## CA-02 - Atualizacao de chamado

Uma atualizacao sera aceita quando:

- registrar autor e data
- ficar visivel no historico
- nao apagar interacoes anteriores

## CA-03 - Mudanca de status

A mudanca de status sera aceita quando:

- ocorrer apenas para status validos
- for registrada no historico
- refletir corretamente na listagem e nos filtros

## CA-04 - Atribuicao de responsavel

A atribuicao sera aceita quando:

- vincular um usuario interno valido ao chamado
- ficar visivel no detalhe e nas listagens
- registrar a alteracao no historico

## CA-05 - Encerramento

O encerramento sera aceito quando:

- alterar o status do chamado para `encerrado`
- registrar data de encerramento
- registrar usuario responsavel

## CA-06 - Reabertura

A reabertura sera aceita quando:

- apenas usuario autorizado puder executa-la
- houver registro do motivo
- o evento ficar salvo no historico

## CA-07 - Pesquisa e filtros

Os filtros serao aceitos quando:

- retornarem resultados coerentes
- permitirem localizar chamados por criterios operacionais
- funcionarem com combinacoes comuns de filtros

## CA-08 - Controle de acesso

O controle de acesso sera aceito quando:

- usuarios nao autorizados nao acessarem funcoes restritas
- administradores visualizarem e gerenciarem o ambiente completo

## CA-09 - Dashboard

O dashboard sera aceito quando:

- apresentar indicadores consistentes com os dados cadastrados
- atualizar os numeros conforme movimentacao dos chamados
