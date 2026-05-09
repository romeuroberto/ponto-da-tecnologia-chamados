# Diretrizes de UX para Criação de Telas do Sistema

## Finalidade do arquivo

Este arquivo define regras, padrões e boas práticas de UX/UI para criação, revisão e refatoração das telas do sistema **Ponto da Tecnologia — Central de Chamados**.

Ele deve ser utilizado por agentes de IA, desenvolvedores e designers como referência obrigatória para garantir:

- Consistência visual;
- Boa usabilidade;
- Compatibilidade com celulares;
- Clareza operacional;
- Identidade visual padronizada;
- Telas administrativas simples, profissionais e eficientes.

> Importante: este documento não é apenas uma sugestão visual. Ele deve orientar decisões de estrutura, comportamento, responsividade, componentes e linguagem da interface.

---

# 1. Princípios gerais

## 1.1 Clareza acima de estética

A tela deve ser bonita, mas antes de tudo precisa ser clara.

O usuário deve entender rapidamente:

- Onde está;
- O que pode fazer;
- Qual informação está sendo exibida;
- Qual ação principal deve tomar;
- O que acontece após cada ação.

Evite elementos decorativos que prejudiquem a leitura ou desviem a atenção do objetivo principal.

---

## 1.2 Cada tela deve ter um objetivo principal

Toda tela deve ter uma finalidade clara.

Exemplos:

- Cadastrar um cliente;
- Visualizar chamados técnicos;
- Consultar detalhes de uma ordem de serviço;
- Confirmar pagamento;
- Acompanhar indicadores financeiros.

A interface deve favorecer esse objetivo principal.

---

## 1.3 Simplicidade operacional

Sempre que possível:

- Reduza excesso de campos;
- Reduza excesso de botões;
- Reduza textos longos;
- Evite informações secundárias ocupando espaço principal;
- Organize conteúdo em blocos, abas, etapas ou cards.

---

## 1.4 Consistência

Componentes semelhantes devem ter aparência e comportamento semelhantes em todo o sistema.

Exemplos:

- Botões primários sempre seguem o mesmo estilo;
- Campos obrigatórios são indicados da mesma forma;
- Tabelas seguem o mesmo padrão;
- Mensagens de erro usam linguagem consistente;
- Ações como editar, excluir, salvar e cancelar mantêm o mesmo comportamento.

---

# 2. Regra central: mobile-first

O sistema deve ser compatível com celulares.

Toda tela deve ser pensada primeiro para funcionar bem em telas pequenas e depois expandida para tablets, notebooks e desktops.

Nenhuma tela deve parecer uma versão espremida do desktop.

## 2.1 Regras mobile obrigatórias

Em celulares:

- Usar layout em uma coluna;
- Priorizar o conteúdo essencial no topo;
- Garantir botões fáceis de tocar;
- Evitar rolagem horizontal;
- Não depender de hover;
- Transformar tabelas em cards ou listas;
- Usar filtros recolhíveis;
- Manter ação principal fácil de encontrar;
- Usar textos legíveis;
- Evitar excesso de informação simultânea.

---

# 3. Identidade visual do sistema

## 3.1 Personalidade visual

A interface deve transmitir:

- Profissionalismo;
- Organização;
- Segurança;
- Clareza operacional;
- Tecnologia;
- Atendimento técnico;
- Confiabilidade;
- Simplicidade administrativa.

O sistema não deve parecer informal demais, colorido demais ou visualmente carregado.

---

## 3.2 Paleta visual

A identidade visual deve usar como base:

- Azul-marinho escuro para navegação lateral e áreas institucionais;
- Azul vivo para ações principais;
- Branco e cinza muito claro para fundos e áreas de conteúdo;
- Vermelho como cor de destaque da marca e alertas pontuais;
- Tons suaves para badges, cards de status e alertas operacionais.

## 3.3 Uso funcional das cores

As cores devem ter significado consistente:

- Azul: ação principal, informação, navegação ativa ou estado neutro importante;
- Azul-marinho: estrutura institucional, menu lateral, cabeçalho de marca;
- Vermelho: erro, crítico, vencido, ação destrutiva ou alerta severo;
- Amarelo/Laranja: atenção, risco, pendente ou em andamento;
- Verde: sucesso, concluído, dentro do prazo ou pago;
- Roxo: estado especial, com uso moderado;
- Cinza: estado neutro, encerrado, desabilitado ou informação secundária.

Evite escolher cores aleatórias para cada tela.

---

# 4. Estrutura geral das telas

## 4.1 Hierarquia recomendada

Toda tela deve seguir uma hierarquia clara:

1. Título da tela;
2. Descrição breve, quando necessário;
3. Ação principal;
4. Conteúdo principal;
5. Ações secundárias;
6. Informações auxiliares.

---

## 4.2 Organização em blocos

Agrupe informações relacionadas.

Exemplos:

- Dados do cliente;
- Dados do equipamento;
- Informações financeiras;
- Histórico de atendimento;
- Anexos;
- Observações internas.

---

## 4.3 Espaçamento

Não comprima elementos.

Evite:

- Campos muito próximos;
- Botões colados;
- Tabelas sem respiro;
- Cards apertados;
- Textos longos sem divisão.

---

# 5. Botões

## 5.1 Botão primário

Use para a principal ação da tela ou bloco.

Exemplos:

- Novo chamado;
- Salvar alterações;
- Confirmar pagamento;
- Finalizar atendimento;
- Criar cliente.

Regras:

- Usar azul de ação;
- Ter texto objetivo;
- Aparecer em destaque;
- Evitar mais de um botão primário na mesma área;
- Em celular, ter largura confortável ou ocupar toda a largura.

---

## 5.2 Botão secundário

Use para ações auxiliares.

Exemplos:

- Cancelar;
- Voltar;
- Limpar filtros;
- Ver detalhes;
- Exportar.

Regras:

- Visual discreto;
- Não competir com o botão primário;
- Pode usar fundo claro e borda suave.

---

## 5.3 Botão destrutivo

Use para ações perigosas.

Exemplos:

- Excluir;
- Cancelar chamado;
- Remover pagamento;
- Apagar anexo.

Regras:

- Usar vermelho com moderação;
- Exigir confirmação;
- Explicar a consequência da ação;
- Nunca posicionar como ação padrão.

---

# 6. Cards

## 6.1 Quando usar

Use cards para:

- Indicadores;
- Resumos;
- Registros em listagens mobile;
- Dados de cliente;
- Dados de chamado;
- Informações financeiras;
- Alertas;
- Atalhos de ação.

## 6.2 Estrutura recomendada

Um card pode conter:

1. Título ou identificação principal;
2. Subtítulo ou contexto;
3. Status ou badge;
4. Informação principal;
5. Metadados;
6. Ação, quando necessário.

## 6.3 Visual

Cards devem ter:

- Fundo claro;
- Borda suave;
- Cantos arredondados;
- Sombra discreta, se necessário;
- Espaçamento interno confortável.

Em celular, cards devem ocupar a largura disponível.

---

# 7. Badges e status

## 7.1 Uso

Use badges para:

- Status de chamado;
- Prioridade;
- SLA;
- Situação financeira;
- Perfil de usuário;
- Categoria;
- Tipo de serviço.

## 7.2 Texto

O texto da badge deve ser curto e claro.

Exemplos:

- Em atendimento;
- Encerrado;
- Alta;
- Média;
- Baixa;
- SLA vencido;
- Dentro do prazo;
- Aguardando pagamento;
- Pago;
- Vencido.

## 7.3 Cores

- Verde: sucesso, pago, concluído, dentro do prazo;
- Amarelo/Laranja: atenção, risco, pendente, em andamento;
- Vermelho: crítico, vencido, erro, cancelado;
- Azul: informação, normal, em análise;
- Cinza: neutro, encerrado, inativo;
- Roxo: estado especial, uso moderado.

Nunca dependa apenas da cor. O texto deve explicar o status.

---

# 8. Formulários

## 8.1 Estrutura recomendada

Um formulário deve conter:

1. Título claro;
2. Descrição curta, se necessário;
3. Campos agrupados por assunto;
4. Indicação de campos obrigatórios;
5. Validação próxima ao campo;
6. Botão principal;
7. Botão secundário, quando necessário;
8. Feedback após envio.

## 8.2 Labels

Todo campo importante deve ter label.

Evite nomes técnicos ou termos de banco de dados.

Ruim:

- client_id;
- service_type_id;
- payment_status.

Bom:

- Cliente;
- Tipo de serviço;
- Status do pagamento.

## 8.3 Validação

Mensagens de erro devem explicar o problema e orientar a correção.

Ruim:

- Campo inválido.

Bom:

- Informe um telefone válido com DDD.

## 8.4 Mobile

Em celulares:

- Usar uma coluna;
- Labels acima dos campos;
- Campos com altura confortável;
- Evitar dois campos pequenos lado a lado;
- Dividir formulários longos em seções;
- Usar teclado adequado por tipo de campo;
- Manter botão principal visível ou fácil de alcançar.

---

# 9. Campos de entrada

Use o tipo correto de campo para cada dado:

- Texto curto;
- Texto longo;
- Número;
- Valor monetário;
- Data;
- Hora;
- Seleção única;
- Seleção múltipla;
- Upload de arquivo;
- Busca com autocomplete.

Regras:

- Aplicar máscara quando ajudar;
- Mostrar exemplo apenas quando necessário;
- Não bloquear o usuário com validações rígidas durante a digitação;
- Validar ao sair do campo ou ao enviar;
- Preservar dados digitados em caso de erro.

---

# 10. Tabelas

## 10.1 Uso

Tabelas podem ser usadas no desktop para:

- Chamados;
- Clientes;
- Pagamentos;
- Serviços;
- Materiais;
- Usuários;
- Relatórios.

## 10.2 Regras

- Colunas mais importantes à esquerda;
- Ações à direita;
- Evitar muitas colunas;
- Não usar textos longos sem limite;
- Manter alinhamento consistente;
- Valores monetários e datas devem ter formato claro.

## 10.3 Mobile

Em celulares:

- Não usar tabela larga como padrão;
- Transformar cada linha em card;
- Mostrar apenas os dados principais;
- Colocar detalhes completos na tela de detalhes;
- Ações secundárias devem ir para menu de opções;
- Evitar rolagem horizontal.

## 10.4 Exemplo de transformação

Tabela desktop de chamados:

- Número;
- Cliente;
- Título;
- Prioridade;
- Status;
- SLA;
- Responsável;
- Atualizado em;
- Ações.

Card mobile de chamado:

- CH-2026-025;
- Computador liga e não dá imagem;
- Cliente: Paulo Roberto;
- Badges: Média, Em atendimento, Dentro do prazo;
- Atualizado em 09/05/2026;
- Botão Ver detalhes.

---

# 11. Filtros e busca

## 11.1 Regras

- Busca principal deve aparecer em destaque;
- Filtros devem ser relevantes;
- Não criar filtros raramente usados;
- Mostrar filtros aplicados;
- Permitir limpar filtros;
- O botão Aplicar filtros deve ser claro;
- O botão Limpar deve ser secundário.

## 11.2 Mobile

Em celulares:

- Mostrar busca simples no topo;
- Colocar filtros avançados em botão “Filtros”;
- Abrir filtros em drawer, modal inferior ou seção expansível;
- Mostrar quantidade de filtros ativos;
- Botões Aplicar e Limpar devem ser fáceis de tocar.

---

# 12. Modais

## 12.1 Quando usar

Use modal para:

- Confirmar exclusão;
- Confirmar cancelamento;
- Registrar informação rápida;
- Visualizar detalhe simples;
- Alertar sobre consequência importante.

## 12.2 Quando evitar

Evite modal para:

- Formulários longos;
- Fluxos com várias etapas;
- Telas complexas;
- Tabelas grandes;
- Conteúdo que exige muita leitura.

## 12.3 Estrutura

Um modal deve conter:

1. Título claro;
2. Texto objetivo;
3. Ação principal;
4. Ação secundária;
5. Fechamento claro.

---

# 13. Drawers e painéis laterais

Use drawer para:

- Detalhes rápidos de um chamado;
- Edição simples;
- Filtros avançados;
- Histórico resumido;
- Dados complementares.

Em celular, drawer pode virar modal inferior ou tela própria.

---

# 14. Abas

Use abas para organizar informações relacionadas.

Exemplo em chamado:

- Resumo;
- Serviços;
- Peças;
- Pagamentos;
- Histórico;
- Anexos.

Regras:

- Usar nomes curtos;
- Não criar abas demais;
- A aba ativa deve estar clara;
- Conteúdo crítico não deve ficar escondido;
- Em celular, abas podem virar lista, acordeão ou menu segmentado.

---

# 15. Feedback, mensagens e alertas

Toda ação importante deve gerar retorno.

Tipos:

- Sucesso;
- Erro;
- Atenção;
- Informação;
- Confirmação.

Exemplos:

- Cliente salvo com sucesso.
- Chamado finalizado.
- Informe um telefone válido com DDD.
- Não foi possível gerar o relatório agora.
- Esta ação removerá o pagamento do histórico.

Em celulares:

- Toasts não devem cobrir ações importantes;
- Mensagens devem ser legíveis;
- Alertas críticos podem usar modal de confirmação.

---

# 16. Estados vazios

Estado vazio deve conter:

1. Mensagem clara;
2. Breve explicação;
3. Ação sugerida, quando aplicável.

Exemplos:

- Nenhum chamado encontrado.
- Ajuste os filtros ou crie um novo chamado.
- Nenhum cliente cadastrado ainda.
- Cadastre o primeiro cliente para começar.

Nunca deixe áreas vazias sem explicação.

---

# 17. Estados de carregamento

Use estados de carregamento em:

- Listas;
- Cards;
- Botões;
- Relatórios;
- Formulários.

Exemplos:

- Carregando chamados...
- Salvando alterações...
- Gerando relatório...
- Registrando pagamento...

Durante envio, desabilite o botão para evitar cliques duplicados.

---

# 18. Menus de ação

Use menus de ação para opções secundárias:

- Editar;
- Duplicar;
- Imprimir;
- Exportar;
- Cancelar;
- Excluir;
- Ver histórico.

Regras:

- Ação principal deve continuar visível;
- Ações perigosas devem ficar separadas ou destacadas;
- O menu deve funcionar por clique e toque;
- Não depender de hover.

---

# 19. Padrões de telas

## 19.1 Tela de listagem operacional

Uso:

- Chamados;
- Clientes;
- Pagamentos;
- Serviços;
- Materiais;
- Usuários.

Desktop:

1. Título;
2. Descrição curta;
3. Botão de ação principal;
4. Resumo de quantidade;
5. Busca e filtros;
6. Tabela;
7. Paginação;
8. Estados vazio, carregamento e erro.

Mobile:

1. Cabeçalho compacto;
2. Botão de ação principal;
3. Busca;
4. Botão de filtros;
5. Lista de cards;
6. Carregar mais ou paginação simples;
7. Estados vazio, carregamento e erro.

---

## 19.2 Tela de detalhes de chamado

Estrutura recomendada:

1. Número do chamado;
2. Título do problema;
3. Cliente;
4. Status e prioridade;
5. SLA ou prazo;
6. Ação principal conforme status;
7. Resumo do atendimento;
8. Dados do equipamento;
9. Serviços executados;
10. Peças utilizadas;
11. Pagamentos;
12. Histórico;
13. Anexos;
14. Ações secundárias.

Mobile:

1. Identificação do chamado;
2. Status, prioridade e SLA;
3. Ação principal;
4. Resumo;
5. Blocos expansíveis de detalhes;
6. Histórico;
7. Ações secundárias.

---

## 19.3 Tela de cadastro de chamado

Estrutura:

1. Cliente;
2. Contato;
3. Equipamento ou item;
4. Defeito relatado;
5. Prioridade;
6. Responsável, se aplicável;
7. Observações;
8. Anexos, se aplicável;
9. Botões Salvar e Cancelar.

Regras:

- Cliente e defeito relatado devem ser priorizados;
- Não exigir dados desnecessários na abertura;
- Permitir complementar informações depois;
- Em celular, usar uma coluna;
- Se o formulário for longo, dividir em etapas ou seções.

---

## 19.4 Tela de cliente

Estrutura:

1. Nome do cliente;
2. Contato principal;
3. Telefone;
4. E-mail;
5. Endereço, se aplicável;
6. Chamados vinculados;
7. Histórico de atendimentos;
8. Ações: editar, novo chamado, ver histórico.

Mobile:

- Dados principais no topo;
- Botão “Novo chamado” em destaque;
- Chamados vinculados como cards;
- Informações secundárias em blocos recolhíveis.

---

## 19.5 Tela financeira

Estrutura:

1. Indicadores financeiros principais;
2. Filtros por período e status;
3. Lista de cobranças, pagamentos ou despesas;
4. Status de cada movimentação;
5. Valores bem destacados;
6. Ações: registrar pagamento, editar, cancelar, emitir documento;
7. Histórico financeiro.

Regras:

- Valores devem ser claros;
- Status financeiro deve ser evidente;
- Ações financeiras sensíveis exigem confirmação;
- Em celular, cada movimentação deve aparecer como card;
- Mostrar valor e vencimento no topo do card.

---

## 19.6 Dashboard

Estrutura:

1. Indicadores essenciais;
2. Alertas operacionais;
3. Atalhos de ação;
4. Filas de atenção;
5. Gráficos ou listas resumidas;
6. Últimas atualizações.

Regras:

- Não transformar dashboard em depósito de métricas;
- Priorizar informações acionáveis;
- Mostrar o que exige atenção primeiro;
- Em celular, indicadores devem ser empilhados ou em grade simples;
- Gráficos devem ser simples e legíveis.

---

# 20. Regras específicas para agentes de IA

Antes de criar ou refatorar uma tela, o agente deve identificar:

1. Qual é o objetivo principal da tela?
2. Quem vai usar esta tela?
3. A tela será usada em celular?
4. Qual é a ação principal?
5. Quais informações são obrigatórias?
6. Quais informações podem ficar em segundo plano?
7. Há risco de exclusão, alteração crítica ou erro operacional?
8. A tela terá tabela, formulário, dashboard ou fluxo em etapas?
9. O que deve aparecer primeiro em uma tela pequena?

---

## 20.1 O agente deve sempre fazer

- Criar título claro;
- Destacar a ação principal;
- Organizar informações em blocos;
- Usar linguagem simples;
- Manter espaçamento adequado;
- Usar componentes consistentes;
- Exibir feedback após ações;
- Validar formulários claramente;
- Indicar campos obrigatórios;
- Tratar estados vazios;
- Tratar estados de erro;
- Tratar estados de carregamento;
- Proteger ações destrutivas com confirmação;
- Garantir leitura confortável em celular;
- Garantir botões fáceis de tocar;
- Evitar rolagem horizontal desnecessária.

---

## 20.2 O agente nunca deve fazer

- Criar telas bonitas, mas difíceis de entender;
- Colocar muitos botões primários competindo;
- Usar tabelas largas sem adaptação para celular;
- Usar textos pequenos demais;
- Usar termos técnicos sem necessidade;
- Esconder a ação principal;
- Criar formulários longos sem divisão;
- Usar apenas cor para indicar status;
- Exibir mensagens de erro genéricas;
- Criar cards ou gráficos sem função real;
- Adicionar campos inventados sem justificativa;
- Depender de hover como única forma de interação;
- Criar menus impossíveis de usar com toque.

---

# 21. Checklist obrigatório antes de finalizar uma tela

Antes de considerar uma tela pronta, verifique:

- A tela tem objetivo claro?
- O título explica onde o usuário está?
- A ação principal está evidente?
- Existem informações demais?
- Os campos têm labels claros?
- Os erros ajudam o usuário?
- A interface mostra retorno após ações?
- Os botões usam textos específicos?
- O layout está organizado em blocos?
- Há consistência com o restante do sistema?
- A tela funciona em celular?
- Os status são compreensíveis?
- Ações perigosas têm confirmação?
- A linguagem está simples e humana?
- Tabelas foram adaptadas para mobile?
- Filtros funcionam bem no celular?
- A tela evita dependência de hover?
- A experiência mobile não parece uma versão espremida do desktop?

---

# 22. Observação final

Este arquivo deve ser mantido no projeto e atualizado sempre que novos padrões de interface forem definidos.

Sempre que um agente de IA for usado para criar ou alterar telas, ele deve consultar este arquivo antes de propor estrutura, layout ou código.
