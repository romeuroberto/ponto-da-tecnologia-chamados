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
