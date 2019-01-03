Getting started with Libbitcoin's native Web/JSON-RPC support

Pre-requisites:
===============

Directory reference for this example:
/home/$(whoami)/libbitcoin is the top level directory where libbitcoin is installed and is the 'root' directory for this howto.

- Compile libbitcoin-server master (to be version4) from source using install.sh:

```
./install.sh --prefix=/home/$(whoami)/libbitcoin --enable-static --disable-shared --build-boost --build-zmq
pushd /home/$(whoami)/libbitcoin
```

- Generate or provide SSL certificates (if secure mode is required) in a sub-directory called secure (or alternatively, update the websocket certificate related settngs in bs.cfg)

```
mkdir secure
pushd secure
openssl req -newkey rsa:4096 -nodes -keyout key.pem -x509 -days 365 -out server.pem
popd
```

Note that having a certificate signed by a particular CA is fully supported, but outside the scope of this document.  If this is required, consult your technical helpdesk on this process.  In this example, we will not be using a CA certificate, only the keypair generated above.

- Clone libbitcoin-web, an unofficial test project for demonstration

```
git clone https://github.com/thecodefactory/libbitcoin-web

# Symlink this directory to "web" (alternatively, update the root setting in bs.cfg from "web" to "libbitcoin-web")
ln -s libbitcoin-web web
```

- Edit libbitcoin server configuration.

```
# Open the configuration file located at etc/libbitcoin/bs.cfg and search for the "[websockets]" section.
# Point to the certificates that were just generated (Note that the relative path 'secure' will work for this since we'll be running the server from the top-level root directory where it's located).
# Comment out the secure/ca.pem line since we are not using it in this example.
# Save and close the configuration file.
```

- Create the libbitcoin-server data store.

./bin/bs --init

- Start libbitcoin-server and allow time for it to sync completely.  This can take some time, but is much quicker if you edit the configuration to use the testnet instead of mainnet.

./bin/bs

Example 1: Using nodejs to query the libbitcoin websocket interface

Once syncing is complete, from another console window, try the nodejs websocket examples (designed to work with mainnet only.  Edit the source and change the transaction_hash to something in testnet if you're using testnet, for example ```var transaction_hash = 'a54e1bba698706dab7af220e6af00007d5d96807392badd550155085c230a151';```)

```
# First install ws (example dependency) if not already installed ...
$ npm install ws
... snip ...

$ nodejs web/examples/libbitcoin-query-example.js 
Got tx via query: 4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b at 1033573,5764796 [1]
Got tx via query: 4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b at 1033573,17367928 [2]
Got tx via query: 4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b at 1033573,28062502 [3]
Got tx via query: 4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b at 1033573,38673257 [4]
Got tx via query: 4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b at 1033573,49273270 [5]
Got tx via query: 4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b at 1033573,59849314 [6]
Got tx via query: 4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b at 1033573,70420660 [7]
Got tx via query: 4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b at 1033573,80953287 [8]
Got tx via query: 4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b at 1033573,91610625 [9]
Got tx via query: 4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b at 1033573,102126579 [10]
... snip ...
```

This simple script issues a query and then waits for the response before issuing the query again, repeatedly until it's stopped.

An alternative script is included called ```web/examples/libbitcoin-query-example-perf.js``` which is much faster because it issues the fetch tx query every millisecond (on a timer).

![Web Screenshot](http://thecodefactory-data.org/libbitcoin/libbitcoin-web-ss-12-28-2018.png "Libbitcoin Web")

Example 2: Using a simple libbitcoin web/websocket interface

While the previous example demonstrates how to use nodejs to query the libbitcoin server using native websockets, this example demonstrates how to visualize some information provided by the server in a browser, also using websockets.

If all of the steps have previously been completed, just point your web browser to http://localhost:9071 (insecure).  This will load the file located at web/index.html, which should render a simple realtime network explorer.  To use the secure interface, some additional steps are required.

- Edit index.html and change `var secure = false;` to `var secure = true;`.
- Start the libbitcoin-server and point your browser to EACH of the following URLs, accepting the self-signed certificate if required:
  - https://localhost:9064
  - https://localhost:9063
  - https://localhost:9062
  - https://localhost:9061
- Finally, point your browser to https://localhost:9061 (secure).

NOTE: When you click any links, they load other pages that are still poining to the PUBLIC service URLs, which will not work when connected to the secure interface.  Edit each of the files and replace, for example, PUBLIC_BLOCK_SERVICE_URL with SECURE_BLOCK_SERVICE_URL (for all applicable services).

Example 3: Using bitcoin-cli to query the Libbitcoin web service directly (using JSON-RPC)

# Issue bitcoin-cli command line specifying the -rpcconnect and -rpcport parameters to point to the public websocket query service IP address and port

```
$ bitcoin-cli -rpcconnect=127.0.0.1 -rpcport=9071 getblockheader 000000000003ba27aa200b1cecaad478d2b00432346c3f1f3986da1afd33e506
{
  "hash": "000000000003ba27aa200b1cecaad478d2b00432346c3f1f3986da1afd33e506",
  "version": "1",
  "versionHex": "00000001",
  "merkleroot": "f3e94742aca4b5ef85488dc37c06c3282295ffec960994b2c0d5ac2a25a95766",
  "time": "1293623863",
  "nonce": "274148111",
  "bits": "1b04864c"
}

$ bitcoin-cli -rpcconnect=127.0.0.1 -rpcport=9071 getblockheader 100000
{
  "hash": "000000000003ba27aa200b1cecaad478d2b00432346c3f1f3986da1afd33e506",
  "version": "1",
  "versionHex": "00000001",
  "merkleroot": "f3e94742aca4b5ef85488dc37c06c3282295ffec960994b2c0d5ac2a25a95766",
  "time": "1293623863",
  "nonce": "274148111",
  "bits": "1b04864c"
}

$ bitcoin-cli -rpcconnect=127.0.0.1 -rpcport=9071 getblockhash 100000
000000000003ba27aa200b1cecaad478d2b00432346c3f1f3986da1afd33e506

$ bitcoin-cli -rpcconnect=127.0.0.1 -rpcport=9071 getblockcount
556832
```

![RPC Screenshot](http://thecodefactory-data.org/libbitcoin/libbitcoin-rpc-ss-12-28-2018.png "Libbitcoin RPC")


