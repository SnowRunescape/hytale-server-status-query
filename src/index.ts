import dgram from 'dgram';
import crypto from 'crypto';

class HytaleQuicClient {
  host: string;
  port: number;
  socket: dgram.Socket | null;
  timeout: number;

  constructor(
    host: string,
    port: number = 5520,
    timeout: number = 5000
  ) {
    this.host = host;
    this.port = port;
    this.socket = null;
    this.timeout = timeout;
  }

  createQuicInitialPacket() {
    const buffer = Buffer.allocUnsafe(1200);
    let offset = 0;

    // Header Form (1 bit) = 1 (Long Header)
    // Fixed Bit (1 bit) = 1
    // Long Packet Type (2 bits) = 00 (Initial)
    // Reserved Bits (2 bits) = 00
    // Packet Number Length (2 bits) = 00 (1 byte)
    const headerByte = 0b11000000; // 0xC0
    buffer.writeUInt8(headerByte, offset++);

    // Version (4 bytes) - QUIC v1 (RFC 9000)
    buffer.writeUInt32BE(0x00000001, offset);
    offset += 4;

    // Destination Connection ID Length (1 byte)
    const destConnIdLength = 8;
    buffer.writeUInt8(destConnIdLength, offset++);

    // Destination Connection ID (8 bytes - random)
    const destConnId = crypto.randomBytes(8);
    destConnId.copy(buffer, offset);
    offset += destConnIdLength;

    // Source Connection ID Length (1 byte)
    const srcConnIdLength = 8;
    buffer.writeUInt8(srcConnIdLength, offset++);

    // Source Connection ID (8 bytes - random)
    const srcConnId = crypto.randomBytes(8);
    srcConnId.copy(buffer, offset);
    offset += srcConnIdLength;

    // Token Length (Variable Length Integer) - 0 para Initial sem token
    buffer.writeUInt8(0, offset++);

    // Length (Variable Length Integer)
    // Tamanho do payload restante (simplificado)
    const payloadLength = 100;
    buffer.writeUInt16BE(0x4000 | payloadLength, offset); // 2-byte VarInt
    offset += 2;

    // Packet Number (1 byte)
    buffer.writeUInt8(0, offset++);

    // Payload - CRYPTO frame com ClientHello simplificado
    // Frame Type: CRYPTO (0x06)
    buffer.writeUInt8(0x06, offset++);

    // Offset (VarInt) - 0
    buffer.writeUInt8(0x00, offset++);

    // Length (VarInt)
    const cryptoDataLength = 50;
    buffer.writeUInt8(cryptoDataLength, offset++);

    // CRYPTO Data (TLS ClientHello simplificado)
    // Este é um ClientHello mínimo para testar a conexão
    const clientHello = Buffer.from([
      0x01, // Handshake Type: ClientHello
      0x00, 0x00, 0x2e, // Length: 46 bytes
      0x03, 0x03, // Version: TLS 1.2 (QUIC usa TLS 1.3 internamente)
      // Random (32 bytes)
      ...crypto.randomBytes(32),
      0x00, // Session ID Length
      0x00, 0x02, // Cipher Suites Length: 2 bytes
      0x13, 0x01, // TLS_AES_128_GCM_SHA256
      0x01, // Compression Methods Length
      0x00, // Compression Method: none
    ]);

    clientHello.copy(buffer, offset, 0, Math.min(clientHello.length, cryptoDataLength));
    offset += cryptoDataLength;

    // Padding para atingir 1200 bytes mínimos
    while (offset < 1200) {
      buffer.writeUInt8(0, offset++);
    }

    return buffer.slice(0, 1200);
  }

  async checkServerStatus() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      this.socket = dgram.createSocket('udp4');

      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout: Servidor não respondeu em ${this.timeout}ms`));
      }, this.timeout);

      this.socket.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(new Error(`Erro na conexão: ${err.message}`));
      });

      this.socket.on('message', (msg, rinfo) => {
        clearTimeout(timeoutId);
        const ping = Date.now() - startTime;

        resolve({
          online: true,
          ping: ping,
        });
      });

      try {
        const quicPacket = this.createQuicInitialPacket();

        this.socket.send(quicPacket, 0, quicPacket.length, this.port, this.host, (err) => {
          if (err) {
            clearTimeout(timeoutId);
            reject(new Error(`Erro ao enviar pacote: ${err.message}`));
          }
        });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(new Error(`Erro ao criar pacote: ${(error as Error).message}`));
      }
    });
  }
}

export { HytaleQuicClient };
