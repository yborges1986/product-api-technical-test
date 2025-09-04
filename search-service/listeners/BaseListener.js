// listeners/BaseListener.js

import { connect, StringCodec } from 'nats';

/**
 * Clase base para todos los listeners NATS
 * Maneja conexión, reconexión automática, manejo de errores y logging estructurado
 */
export class BaseListener {
  constructor(subject, listenerName) {
    this.subject = subject;
    this.listenerName = listenerName;
    this.natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
    this.reconnectDelay = 5000;
    this.maxReconnectAttempts = 10;
    this.reconnectAttempts = 0;
  }

  /**
   * Establece conexión con NATS
   */
  async connect() {
    try {
      this.natsConnection = await connect({ servers: this.natsUrl });
      this.stringCodec = StringCodec();
      this.reconnectAttempts = 0;
      console.log(`✅ ${this.listenerName} conectado a NATS: ${this.natsUrl}`);
      return this.natsConnection;
    } catch (error) {
      this.logError('Error al conectar con NATS', error);
      await this.handleReconnection();
      throw error;
    }
  }

  /**
   * Maneja la reconexión automática
   */
  async handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logError(
        `Máximo número de intentos de reconexión alcanzado (${this.maxReconnectAttempts})`
      );
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `🔄 Reintentando conexión ${this.listenerName} (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    setTimeout(async () => {
      try {
        await this.start();
      } catch (error) {
        this.logError('Error en reconexión', error);
      }
    }, this.reconnectDelay);
  }

  /**
   * Decodifica y parsea un mensaje NATS
   */
  decodeMessage(message) {
    try {
      const decodedMessage = this.stringCodec.decode(message.data);
      return JSON.parse(decodedMessage);
    } catch (error) {
      this.logError('Error al decodificar mensaje', error, {
        messageData: message.data?.toString(),
      });
      throw error;
    }
  }

  /**
   * Procesa mensajes de manera segura
   */
  async processMessage(message) {
    try {
      const messageData = this.decodeMessage(message);
      console.log(`📨 Mensaje recibido en ${this.subject}:`, messageData);

      await this.handleMessage(messageData);
    } catch (error) {
      this.logError(`Error al procesar mensaje ${this.subject}`, error);
      // No relanzar el error para que el listener continúe funcionando
    }
  }

  /**
   * Inicia el listener
   */
  async start() {
    try {
      await this.connect();

      const subscription = this.natsConnection.subscribe(this.subject);
      console.log(
        `👂 ${this.listenerName} esperando mensajes en ${this.subject}...`
      );

      for await (const message of subscription) {
        await this.processMessage(message);
      }
    } catch (error) {
      this.logError(`Error en ${this.listenerName}`, error);
      await this.handleReconnection();
    }
  }

  /**
   * Logging estructurado de errores
   */
  logError(message, error = null, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      listener: this.listenerName,
      subject: this.subject,
      message,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : null,
      context,
      reconnectAttempts: this.reconnectAttempts,
    };

    console.error('❌ Error en listener:', JSON.stringify(errorLog, null, 2));
  }

  /**
   * Método abstracto que debe ser implementado por las clases hijas
   * @param {Object} messageData - Datos del mensaje decodificado
   */
  async handleMessage(messageData) {
    throw new Error('handleMessage debe ser implementado por la clase hija');
  }

  /**
   * Limpia datos del producto para Elasticsearch
   */
  cleanProductData(productData) {
    const cleanData = { ...productData };

    // Remover campos de usuario que no necesitamos indexar
    delete cleanData.createdBy;
    delete cleanData.approvedBy;

    return cleanData;
  }

  /**
   * Cierra la conexión NATS
   */
  async close() {
    if (this.natsConnection) {
      await this.natsConnection.close();
      console.log(`🔌 ${this.listenerName} desconectado de NATS`);
    }
  }
}
