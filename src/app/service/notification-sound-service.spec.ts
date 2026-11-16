import { TestBed } from '@angular/core/testing';
import { NotificationSoundService } from './notification-sound-service';

describe('NotificationSoundService', () => {
  const original = (window as { AudioContext?: unknown }).AudioContext;

  afterEach(() => {
    (window as { AudioContext?: unknown }).AudioContext = original;
  });

  it('plays a short tone through the Web Audio API', () => {
    const start = vi.fn();
    const stop = vi.fn();
    const param = () => ({ setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
    class FakeAudioContext {
      state = 'running';
      currentTime = 0;
      destination = {};
      resume = vi.fn(() => Promise.resolve());
      createOscillator = () => ({ type: '', frequency: param(), connect: vi.fn(), start, stop });
      createGain = () => ({ gain: param(), connect: vi.fn() });
    }
    (window as { AudioContext?: unknown }).AudioContext = FakeAudioContext;

    TestBed.inject(NotificationSoundService).play();

    expect(start).toHaveBeenCalledTimes(1);
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('fails silently when the browser blocks or lacks audio', () => {
    (window as { AudioContext?: unknown }).AudioContext = class {
      constructor() {
        throw new Error('blocked');
      }
    };
    const service = TestBed.inject(NotificationSoundService);
    expect(() => service.play()).not.toThrow();

    (window as { AudioContext?: unknown }).AudioContext = undefined;
    expect(() => TestBed.inject(NotificationSoundService).play()).not.toThrow();
  });

  it('swallows a rejected resume of a suspended audio context', async () => {
    const resume = vi.fn(() => Promise.reject(new Error('autoplay policy')));
    const param = () => ({ setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
    (window as { AudioContext?: unknown }).AudioContext = class {
      state = 'suspended';
      currentTime = 0;
      destination = {};
      resume = resume;
      createOscillator = () => ({
        type: '',
        frequency: param(),
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      });
      createGain = () => ({ gain: param(), connect: vi.fn() });
    };

    expect(() => TestBed.inject(NotificationSoundService).play()).not.toThrow();
    await Promise.resolve();
    expect(resume).toHaveBeenCalledTimes(1);
  });
});
