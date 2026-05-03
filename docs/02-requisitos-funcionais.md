# Requisitos Funcionais

## RF-01 - Autenticacao de usuarios

O sistema deve permitir login de usuarios internos com e-mail e senha.

## RF-02 - Cadastro de usuarios

O sistema deve permitir que administradores cadastrem usuarios internos com perfis e permissoes basicas.

## RF-03 - Cadastro de clientes

O sistema deve permitir cadastrar clientes com informacoes como razao social ou nome, contato principal, telefone, e-mail e observacoes.

## RF-04 - Listagem de clientes

O sistema deve permitir pesquisar, listar e visualizar clientes cadastrados.

## RF-05 - Abertura de chamado

O sistema deve permitir registrar um chamado vinculado a um cliente, contendo no minimo:

- titulo
- descricao do problema
- categoria
- prioridade
- solicitante
- data e hora de abertura

## RF-06 - Numeracao unica de chamado

O sistema deve gerar um identificador unico para cada chamado.

## RF-07 - Status de chamado

O sistema deve permitir controlar o status do chamado com os estados minimos:

- aberto
- em atendimento
- aguardando cliente
- resolvido
- encerrado
- cancelado

## RF-08 - Atribuicao de responsavel

O sistema deve permitir atribuir um tecnico ou atendente responsavel ao chamado.

## RF-09 - Atualizacao de prioridade

O sistema deve permitir alterar a prioridade do chamado conforme a necessidade operacional.

## RF-10 - Registro de interacoes

O sistema deve permitir registrar comentarios, tratativas e atualizacoes no historico do chamado, informando autor e data.

## RF-11 - Consulta de historico

O sistema deve permitir visualizar o historico completo do chamado em ordem cronologica.

## RF-12 - Filtros e busca

O sistema deve permitir filtrar chamados por:

- cliente
- status
- prioridade
- responsavel
- periodo
- texto livre

## RF-13 - Painel de chamados

O sistema deve exibir uma visao geral de chamados com informacoes resumidas para acompanhamento diario.

## RF-14 - Encerramento de chamado

O sistema deve permitir encerrar chamados resolvidos, registrando data e responsavel pelo encerramento.

## RF-15 - Reabertura de chamado

O sistema deve permitir reabrir um chamado encerrado ou resolvido, mediante permissao.

## RF-16 - Registro de anexos

O sistema deve permitir anexar arquivos ao chamado, como imagens, documentos ou evidencias.

## RF-17 - Controle de permissoes

O sistema deve restringir acoes de acordo com o perfil do usuario.

## RF-18 - Dashboard basico

O sistema deve apresentar indicadores simples, como:

- chamados abertos
- chamados por status
- chamados por prioridade
- chamados por tecnico

## RF-19 - Auditoria basica

O sistema deve registrar alteracoes relevantes em chamados, como mudanca de status, prioridade e responsavel.

## RF-20 - Exportacao simples

O sistema deve permitir exportar listagens basicas de chamados para uso gerencial, preferencialmente em CSV.
