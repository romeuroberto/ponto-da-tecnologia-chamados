# Modelo de Dados Inicial

## Entidade: Usuario

Campos sugeridos:

- id
- nome
- email
- senha_hash
- perfil
- ativo
- criado_em
- atualizado_em

## Entidade: Cliente

Campos sugeridos:

- id
- nome
- documento
- contato_principal
- email
- telefone
- observacoes
- ativo
- criado_em
- atualizado_em

## Entidade: Chamado

Campos sugeridos:

- id
- numero
- cliente_id
- titulo
- descricao
- categoria
- prioridade
- status
- solicitante_nome
- solicitante_email
- responsavel_id
- aberto_por_usuario_id
- data_abertura
- data_resolucao
- data_encerramento
- motivo_encerramento
- criado_em
- atualizado_em

## Entidade: HistoricoChamado

Campos sugeridos:

- id
- chamado_id
- autor_usuario_id
- tipo_evento
- descricao
- status_anterior
- status_novo
- prioridade_anterior
- prioridade_nova
- responsavel_anterior_id
- responsavel_novo_id
- criado_em

## Entidade: Anexo

Campos sugeridos:

- id
- chamado_id
- nome_arquivo
- caminho_arquivo
- tipo_mime
- tamanho_bytes
- enviado_por_usuario_id
- criado_em

## Relacionamentos principais

- um cliente possui muitos chamados
- um chamado possui muitos registros de historico
- um chamado pode possuir muitos anexos
- um usuario pode ser responsavel por muitos chamados

## Enumeracoes sugeridas

### Perfil de usuario

- administrador
- atendente
- tecnico

### Status de chamado

- aberto
- em_atendimento
- aguardando_cliente
- resolvido
- encerrado
- cancelado

### Prioridade

- baixa
- media
- alta
- critica
