# Regras de Negocio

## RN-01 - Todo chamado deve estar vinculado a um cliente

Nao deve existir chamado sem associacao a um cliente valido.

## RN-02 - Todo chamado deve possuir status

Um chamado sempre deve estar em um status valido do fluxo definido.

## RN-03 - Todo chamado deve possuir prioridade

No minimo, deve ser definida uma prioridade no momento da abertura.

## RN-04 - O numero do chamado deve ser unico

Cada chamado deve ser identificado por um codigo unico para rastreabilidade.

## RN-05 - Mudancas importantes devem ser registradas

Alteracoes de status, prioridade, responsavel e encerramento devem gerar historico automatico.

## RN-06 - Chamado encerrado nao deve ser editado livremente

Chamados encerrados devem ter edicoes restritas, exceto por usuarios autorizados ou mediante reabertura.

## RN-07 - Reabertura deve gerar registro

Toda reabertura de chamado deve ser registrada no historico com autor, data e motivo.

## RN-08 - Encerramento depende de resolucao

Preferencialmente, um chamado deve passar por resolvido antes de ser encerrado, salvo excecoes autorizadas.

## RN-09 - Responsavel pode ser obrigatorio apos triagem

Chamados podem ser abertos sem responsavel, mas nao devem seguir para atendimento sem atribuicao.

## RN-10 - Cliente deve possuir ao menos um meio de contato

Cada cliente deve possuir ao menos e-mail, telefone ou contato principal registrado.

## RN-11 - Prioridade deve seguir padrao unico

Sugestao de prioridades:

- baixa
- media
- alta
- critica

## RN-12 - Exclusao de chamados deve ser restrita

Para preservar historico, chamados nao devem ser excluidos fisicamente em operacao normal. O ideal e usar cancelamento ou inativacao logica.

## RN-13 - Atribuicao operacional deve priorizar perfis de atendimento

Na atribuicao de responsavel do chamado, a lista operacional deve priorizar usuarios com perfil de `TECHNICIAN` e `ATTENDANT`.

## RN-14 - Perfil `ADMIN` nao deve ser responsavel operacional padrao

Usuarios `ADMIN` podem manter acesso total ao sistema, mas nao devem aparecer como opcao padrao de atribuicao operacional, salvo futura regra explicita da empresa para uso administrativo em chamados.

## RN-15 - Sugestao de responsavel deve considerar a categoria do chamado

O sistema deve orientar a atribuicao com base no tipo de demanda.

Sugestao inicial:

- `ATTENDANT` primeiro para categorias como:
  - acesso
  - e-mail
  - office
  - demandas simples de cadastro ou liberacao
- `TECHNICIAN` primeiro para categorias como:
  - infraestrutura
  - rede
  - hardware
  - backup
  - banco de dados
  - sistema
  - seguranca
  - PDV

## RN-16 - Todo atendimento deve nascer como chamado

O `Ticket` deve ser o ponto unico de entrada da demanda.

Isso significa:

- atendimento remoto gera chamado
- atendimento interno gera chamado
- equipamento recebido na assistencia gera chamado
- visita tecnica gera chamado

Nao deve existir `Ordem de Servico` criada de forma avulsa, sem um chamado vinculado.

## RN-17 - Ordem de servico deve ser opcional e vinculada ao chamado

A `Ordem de Servico` deve existir apenas quando houver necessidade de formalizar a execucao operacional.

Exemplos mais comuns:

- diagnostico tecnico formal
- atendimento de bancada
- visita tecnica em campo
- uso de checklist
- troca de pecas
- retirada ou entrega de equipamento
- necessidade de assinatura, aprovacao ou evidencias adicionais

Chamados simples podem ser resolvidos sem gerar `Ordem de Servico`.

## RN-18 - Um chamado pode possuir zero, uma ou varias ordens de servico

O chamado continua sendo a entidade principal do fluxo tecnico e do relacionamento com o cliente.

Ja a `Ordem de Servico` representa uma execucao operacional concreta vinculada a esse chamado.

Com isso:

- um chamado pode nao ter nenhuma `Ordem de Servico`
- um chamado pode ter uma unica `Ordem de Servico`
- um chamado pode ter varias `Ordens de Servico` quando houver etapas distintas de execucao

## RN-19 - Equipamento recebido presencialmente deve abrir chamado antes da execucao

Quando o cliente entregar um equipamento na assistencia, o sistema deve abrir primeiro um chamado para registrar a entrada da demanda.

A `Ordem de Servico` podera ser criada depois, caso o atendimento exija controle adicional de execucao, bancada, checklist, pecas, testes, retirada ou entrega.

## RN-20 - Tipo de atendimento deve orientar o fluxo desde a abertura

Na abertura do chamado, o sistema deve permitir informar o tipo de atendimento para orientar o fluxo operacional e a UX.

Sugestao inicial de tipos:

- `ATENDIMENTO_REMOTO`
- `ATENDIMENTO_INTERNO`
- `EQUIPAMENTO_RECEBIDO_ASSISTENCIA`
- `VISITA_TECNICA`

Esse campo deve ajudar o sistema a:

- orientar a triagem inicial
- sugerir se ha necessidade de `Ordem de Servico`
- facilitar a leitura do contexto do chamado
- tornar o fluxo mais intuitivo para o usuario
