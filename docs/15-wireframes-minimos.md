# Wireframes Minimos

Objetivo: descrever apenas a estrutura das telas necessarias para a IA implementar o frontend do MVP.

## 1. Login

Desktop:
- card central
- logo/nome do sistema
- campo e-mail
- campo senha
- botao entrar

Mobile:
- mesma estrutura em coluna unica
- card com largura fluida

## 2. Layout autenticado

Desktop:
- sidebar esquerda fixa
- topo com busca, nome do usuario e sair
- area principal com conteudo

Mobile:
- header com menu hamburguer
- menu em drawer
- conteudo em coluna unica

Itens da navegacao:
- dashboard
- chamados
- clientes
- usuarios

## 3. Dashboard

Blocos:
- cards de resumo: abertos, em atendimento, aguardando cliente, encerrados
- lista curta: chamados prioritarios
- lista curta: chamados recentes

Mobile:
- cards empilhados
- listas em coluna unica

## 4. Listagem de chamados

Topo:
- titulo da tela
- busca
- filtros
- botao novo chamado

Conteudo desktop:
- tabela com colunas: numero, cliente, titulo, prioridade, status, responsavel, atualizacao, acoes

Conteudo mobile:
- lista de cards
- cada card mostra: numero, cliente, titulo, prioridade, status, responsavel
- acao principal: abrir detalhe

Filtros:
- status
- prioridade
- cliente
- responsavel
- periodo

## 5. Detalhe do chamado

Cabecalho:
- numero
- titulo
- badges de status e prioridade
- acoes rapidas

Bloco principal:
- cliente
- descricao
- solicitante
- responsavel
- datas

Bloco lateral ou inferior:
- alterar status
- alterar responsavel
- alterar prioridade

Historico:
- lista cronologica
- comentario
- mudancas de status
- anexos

Nova interacao:
- textarea
- upload
- botao salvar

Mobile:
- tudo em coluna unica
- acoes rapidas em faixa superior ou bloco proprio

## 6. Novo chamado

Campos:
- cliente
- titulo
- descricao
- categoria
- prioridade
- solicitante nome
- solicitante e-mail

Acoes:
- salvar
- cancelar

Mobile:
- formulario em coluna unica

## 7. Listagem de clientes

Topo:
- busca
- botao novo cliente

Conteudo desktop:
- tabela com nome, contato, telefone, e-mail, total de chamados, acoes

Conteudo mobile:
- cards com nome, contato, telefone e acoes

## 8. Formulario de cliente

Campos:
- nome
- documento
- contato principal
- e-mail
- telefone
- observacoes

## 9. Listagem de usuarios

Topo:
- busca
- filtro por perfil
- botao novo usuario

Conteudo:
- nome
- e-mail
- perfil
- status
- acoes

## 10. Formulario de usuario

Campos:
- nome
- e-mail
- senha
- perfil
- ativo

## Componentes obrigatorios

- badge de status
- badge de prioridade
- tabela responsiva
- card de resumo
- drawer mobile
- formulario com validacao
- toast de sucesso/erro
- dialog de confirmacao
