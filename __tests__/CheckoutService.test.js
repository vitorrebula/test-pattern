import { CheckoutService } from '../src/services/CheckoutService.js';
import { Item } from '../src/domain/Item.js';
import { UserMother } from './builders/UserMother.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';

describe('CheckoutService', () => {

  describe('quando o pagamento falha', () => {
    it('deve retornar null', async () => {
      // Arrange
      const carrinho = new CarrinhoBuilder().build();

      const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: false }) };
      const repositoryDummy = {};
      const emailDummy = {};

      const checkoutService = new CheckoutService(gatewayStub, repositoryDummy, emailDummy);

      // Act
      const pedido = await checkoutService.processarPedido(carrinho, {});

      // Assert
      expect(pedido).toBeNull();
    });
  });

  describe('quando um cliente Premium finaliza a compra', () => {
    it('deve cobrar com 10% de desconto e enviar e-mail de confirmação', async () => {
      // Arrange
      const usuarioPremium = UserMother.umUsuarioPremium();
      const carrinho = new CarrinhoBuilder()
        .comUser(usuarioPremium)
        .comItens([new Item('Produto X', 200)])
        .build();

      const pedidoSalvo = { id: 'pedido-123', carrinho, totalFinal: 180, status: 'PROCESSADO' };

      const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
      const repositoryStub = { salvar: jest.fn().mockResolvedValue(pedidoSalvo) };
      const emailMock = { enviarEmail: jest.fn().mockResolvedValue(undefined) };

      const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailMock);

      // Act
      await checkoutService.processarPedido(carrinho, {});

      // Assert (Verificação de Comportamento)
      expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, {});

      expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
      expect(emailMock.enviarEmail).toHaveBeenCalledWith(
        'premium@email.com',
        'Seu Pedido foi Aprovado!',
        expect.any(String)
      );
    });
  });

});
