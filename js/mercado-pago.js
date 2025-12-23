// mercado-pago.js - Integração com Mercado Pago
class MercadoPagoIntegration {
    constructor() {
        this.publicKey = CONFIG.MERCADO_PAGO.PUBLIC_KEY;
        this.accessToken = CONFIG.MERCADO_PAGO.ACCESS_TOKEN;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        
        // Carregar SDK do Mercado Pago
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.onload = () => {
            this.mp = new MercadoPago(this.publicKey);
            this.isInitialized = true;
            console.log('Mercado Pago SDK carregado');
        };
        document.head.appendChild(script);
    }

    async createPreference(paymentData) {
        try {
            const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: [{
                        title: paymentData.description,
                        unit_price: paymentData.amount,
                        quantity: 1,
                        currency_id: 'BRL'
                    }],
                    payer: {
                        email: paymentData.email,
                        name: paymentData.name
                    },
                    back_urls: {
                        success: `${window.location.origin}/payment-success`,
                        failure: `${window.location.origin}/payment-failure`,
                        pending: `${window.location.origin}/payment-pending`
                    },
                    auto_return: 'approved',
                    notification_url: `${window.location.origin}/api/payment-notification`,
                    external_reference: paymentData.externalReference,
                    statement_descriptor: 'NOVATEK DEV'
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao criar preferência:', error);
            throw error;
        }
    }

    async processPayment(paymentData) {
        await this.initialize();
        
        const preference = await this.createPreference(paymentData);
        
        // Criar botão de pagamento
        const bricksBuilder = this.mp.bricks();
        
        await bricksBuilder.create('wallet', 'wallet_container', {
            initialization: {
                preferenceId: preference.id,
            },
            customization: {
                texts: {
                    valueProp: 'smart_option'
                }
            }
        });
        
        return preference;
    }

    async getPaymentStatus(paymentId) {
        try {
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao obter status do pagamento:', error);
            throw error;
        }
    }

    renderPaymentButton(plan, user) {
        return `
            <button class="btn-payment btn-payment-primary" data-plan="${plan.id}">
                <i class="fas fa-credit-card"></i>
                <span>Assinar ${plan.name} - R$ ${plan.price}/mês</span>
            </button>
        `;
    }
}

// Instância global
const mercadoPago = new MercadoPagoIntegration();