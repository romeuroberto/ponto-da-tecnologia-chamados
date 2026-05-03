# Fluxo operacional do chamado

## Objetivo
Deixar claro que o sistema trabalha com duas trilhas ligadas ao mesmo chamado:
- trilha tecnica
- trilha financeira

O chamado so deve ser entendido como totalmente finalizado quando as duas trilhas estiverem concluídas.

## Fluxo ideal
1. Abertura
- chamado criado
- status tecnico inicial: `OPEN`
- objetivo: registrar demanda, cliente, solicitante e prioridade

2. Atendimento
- status tecnico: `IN_PROGRESS` ou `WAITING_CUSTOMER`
- objetivo: executar diagnostico, tratativa e registrar interacoes

3. Encerramento tecnico
- status tecnico: `RESOLVED` ou `CLOSED`
- `RESOLVED`: solucao aplicada, aguardando validacao ou fechamento
- `CLOSED`: atendimento tecnico encerrado

4. Financeiro
- criar ou revisar resumo financeiro do chamado
- definir:
  - tipo de cobranca
  - desconto
  - observacoes internas
- adicionar lancamentos:
  - horas
  - pecas
  - deslocamento
  - extras

5. Faturamento
- status financeiro esperado: `APROVADO` ou `FATURADO`
- objetivo: validar o valor e registrar que o chamado esta pronto para cobranca ou ja foi faturado

6. Recebimento
- status financeiro final: `PAGO`
- objetivo: registrar que o valor foi recebido

## Regra de leitura do chamado
- `OPEN`, sem financeiro:
  - aberto e aguardando inicio
- `IN_PROGRESS`:
  - em atendimento tecnico
- `WAITING_CUSTOMER`:
  - aguardando retorno do cliente
- `RESOLVED`:
  - resolvido tecnicamente, aguardando encerramento tecnico
- `CLOSED`, sem financeiro:
  - encerrado tecnicamente, aguardando financeiro
- `CLOSED`, com financeiro `PENDENTE`, `EM_ANALISE` ou `APROVADO`:
  - concluido aguardando faturamento
- `CLOSED`, com financeiro `FATURADO`:
  - faturado aguardando recebimento
- `CLOSED`, com financeiro `PAGO`:
  - totalmente finalizado

## Regra de UX
No detalhe do chamado, a interface deve mostrar:
- status tecnico
- status financeiro
- etapa atual do fluxo
- proxima acao recomendada

## Proxima direcao
O sistema deve tratar o fluxo como uma jornada unica visivel ao usuario, mesmo mantendo separadas internamente:
- operacao tecnica
- operacao financeira
