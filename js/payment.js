// payment.js - Sistema de pagamentos
class PaymentSystem {
    constructor() {
        this.currentPayment = null;
        this.init();
    }

    init() {
        // Inicializar Mercado Pago
        mercadoPago.initialize();
    }

    async createSubscription(userId, planId, paymentMethod = 'credit_card') {
        const user = database.getUserById(userId);
        const plan = CONFIG.PLANS[planId.toUpperCase()];
        
        if (!user || !plan) {
            throw new Error('Usuário ou plano inválido');
        }

        // Criar registro de pagamento
        const payment = database.createPayment({
            userId: user.id,
            amount: plan.price,
            plan: plan.id,
            status: 'pending',
            paymentMethod,
            description: `Assinatura ${plan.name} - NOVATEK DEV`
        });

        this.currentPayment = payment;

        // Criar assinatura no Mercado Pago
        try {
            const preference = await mercadoPago.createPreference({
                amount: plan.price,
                description: `Assinatura ${plan.name} - NOVATEK DEV`,
                email: user.email,
                name: user.name,
                externalReference: `user_${user.id}_payment_${payment.id}`
            });

            // Redirecionar para checkout
            window.location.href = preference.init_point;
            
            return { success: true, payment, preference };
        } catch (error) {
            console.error('Erro ao criar assinatura:', error);
            
            // Atualizar status do pagamento
            database.updateUser(user.id, { status: 'payment_failed' });
            
            return { 
                success: false, 
                error: 'Erro ao processar pagamento',
                message: error.message 
            };
        }
    }

    async handlePaymentCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentId = urlParams.get('payment_id');
        const status = urlParams.get('status');
        const externalReference = urlParams.get('external_reference');

        if (!paymentId || !status || !externalReference) {
            return { success: false, error: 'Parâmetros inválidos' };
        }

        // Extrair IDs
        const match = externalReference.match(/user_(\d+)_payment_(\d+)/);
        if (!match) {
            return { success: false, error: 'Referência inválida' };
        }

        const userId = parseInt(match[1]);
        const paymentIdDb = parseInt(match[2]);

        // Obter status do pagamento do Mercado Pago
        const paymentStatus = await mercadoPago.getPaymentStatus(paymentId);
        
        // Atualizar status do usuário
        if (paymentStatus.status === 'approved') {
            // Criar assinatura
            database.createSubscription({
                userId: userId,
                plan: paymentStatus.external_reference?.split('_')[2] || 'junior',
                paymentId: paymentIdDb,
                status: 'active',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });

            // Atualizar usuário
            database.updateUser(userId, {
                status: 'active',
                plan: paymentStatus.external_reference?.split('_')[2] || 'junior'
            });

            // Adicionar notificação
            database.addNotification(userId, {
                title: 'Assinatura ativada!',
                message: 'Sua assinatura foi ativada com sucesso. Bem-vindo à NOVATEK DEV!',
                type: 'success'
            });

            // Adicionar atividade
            database.addActivity({
                type: 'subscription_activated',
                message: `Nova assinatura ativada: ${user.name}`
            });

            return { success: true, status: 'approved' };
        } else {
            database.updateUser(userId, { status: 'payment_failed' });
            
            database.addNotification(userId, {
                title: 'Pagamento não aprovado',
                message: 'Houve um problema com seu pagamento. Por favor, tente novamente.',
                type: 'danger'
            });

            return { success: false, status: paymentStatus.status };
        }
    }

    renderPaymentModal(plan, user) {
        return `
            <div class="payment-modal">
                <div class="payment-header">
                    <h3>Finalizar Assinatura</h3>
                    <p>Plano ${plan.name} - R$ ${plan.price}/mês</p>
                </div>
                
                <div class="payment-body">
                    <div class="plan-summary">
                        <h4>Resumo do Plano</h4>
                        <ul>
                            ${plan.features.map(feature => `
                                <li><i class="fas fa-check"></i> ${feature}</li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    <div class="payment-methods">
                        <h4>Método de Pagamento</h4>
                        <div class="methods-grid">
                            <div class="method-card active" data-method="credit_card">
                                <i class="fas fa-credit-card"></i>
                                <span>Cartão de Crédito</span>
                            </div>
                            <div class="method-card" data-method="pix">
                                <i class="fas fa-qrcode"></i>
                                <span>PIX</span>
                            </div>
                            <div class="method-card" data-method="boleto">
                                <i class="fas fa-barcode"></i>
                                <span>Boleto</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="payment-form hidden" id="credit_card_form">
                        <!-- Formulário de cartão será injetado pelo Mercado Pago -->
                        <div id="wallet_container"></div>
                    </div>
                    
                    <div class="payment-form hidden" id="pix_form">
                        <div class="pix-info">
                            <p>Você será redirecionado para gerar um código PIX</p>
                        </div>
                    </div>
                    
                    <div class="payment-form hidden" id="boleto_form">
                        <div class="boleto-info">
                            <p>O boleto será gerado após a confirmação</p>
                        </div>
                    </div>
                </div>
                
                <div class="payment-footer">
                    <button class="btn btn-outline" id="cancel-payment">Cancelar</button>
                    <button class="btn btn-primary" id="confirm-payment">
                        <i class="fas fa-lock"></i> Confirmar Pagamento
                    </button>
                </div>
            </div>
        `;
    }
}

// Instância global
const paymentSystem = new PaymentSystem();