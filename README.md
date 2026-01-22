# Hytale Server Status Query

A library for querying Hytale server status using the QUIC protocol.

## Overview

This library provides a simple and efficient way to check the status of Hytale game servers. It implements a QUIC client that can connect to Hytale servers and retrieve their online status and latency information.

### Features

- ✅ QUIC protocol support
- ✅ Server status checking (online/offline)
- ✅ Ping measurement

## Installation

Install the package using npm:

```bash
npm install hytale-server-status-query
```

```bash
yarn add hytale-server-status-query
```

## Usage

### Basic Usage

```ts
import { HytaleQuicClient } from 'hytale-server-status-query';

const client = new HytaleQuicClient('your-server-address.com');

client.checkServerStatus()
  .then(result => {
    console.log('Server Status:', result);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Made with ❤️ by the SnowDev
