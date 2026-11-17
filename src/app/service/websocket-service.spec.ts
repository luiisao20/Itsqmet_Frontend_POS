import { TestBed } from '@angular/core/testing';
import { Client, IFrame, IMessage, messageCallbackType } from '@stomp/stompjs';
import { WebSocketService } from './websocket-service';

/**
 * Pins the WebSocketService.listen contract the realtime screens (cocina, cliente-pedidos)
 * and the global order notifier rely on. The STOMP client is stubbed on its prototype,
 * so no real socket is ever opened.
 */
describe('WebSocketService.listen', () => {
  let client: Client | undefined;
  let stompCallbacks: Map<string, messageCallbackType>;
  let subscribeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    client = undefined;
    stompCallbacks = new Map();
    vi.spyOn(Client.prototype, 'activate').mockImplementation(function (this: Client) {
      client = this;
    });
    vi.spyOn(Client.prototype, 'deactivate').mockResolvedValue(undefined);
    subscribeSpy = vi
      .spyOn(Client.prototype, 'subscribe')
      .mockImplementation((destination: string, callback: messageCallbackType) => {
        stompCallbacks.set(destination, callback);
        return { id: destination, unsubscribe: vi.fn() };
      });
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function connectBroker(): void {
    client!.onConnect({} as IFrame);
  }

  function brokerSends(topic: string, body: string): void {
    stompCallbacks.get(topic)!({ body } as IMessage);
  }

  it('delivers parsed messages to every subscriber and keeps the others alive when one unsubscribes', () => {
    const service = TestBed.inject(WebSocketService);
    const screen: unknown[] = [];
    const globalListener: unknown[] = [];

    const screenSub = service.listen('/topic/pedidos').subscribe((p) => screen.push(p));
    service.listen('/topic/pedidos').subscribe((p) => globalListener.push(p));
    connectBroker();

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    brokerSends('/topic/pedidos', '{"id":1}');
    screenSub.unsubscribe();
    brokerSends('/topic/pedidos', '{"id":2}');
    brokerSends('/topic/pedidos', 'not-json');

    expect(screen).toEqual([{ id: 1 }]);
    expect(globalListener).toEqual([{ id: 1 }, { id: 2 }, 'not-json']);
    expect(Client.prototype.deactivate).not.toHaveBeenCalled();
  });

  it('subscribes a topic immediately when listen is called after the connection is open', () => {
    const service = TestBed.inject(WebSocketService);
    connectBroker();
    const received: unknown[] = [];

    service.listen('/topic/cocina').subscribe((p) => received.push(p));
    brokerSends('/topic/cocina', '{"id":7}');

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    expect(received).toEqual([{ id: 7 }]);
  });
});
