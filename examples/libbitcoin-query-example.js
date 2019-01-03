var WebSocket = require('ws');
var process = require('process');

var random = 0;
var queries_processed = 0;
var transaction_hash = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';

/////////////////////////////////////////////////////
// setup the query socket connection and handlers
/////////////////////////////////////////////////////

var query_url = 'ws://localhost:9071';
var query_socket = new WebSocket(query_url,
{
    origin: 'http://localhost:9071',
    rejectUnauthorized: false
});

function fetch_transaction(tx_hash)
{
    random = parseInt(Math.random() * 1000000);

    let request = JSON.stringify({
        'id' : random,
        'method' : 'getrawtransaction',
        'params' : [ tx_hash ] });

    query_socket.send(request);
}

query_socket.on('open', function(message)
{
    // Initiate a query to fetch the transaction.
    fetch_transaction(transaction_hash);
});

query_socket.on('message', function(message)
{
    let tx = JSON.parse(message);
    if (tx.id == random)
    {
        if (tx.error != undefined)
        {
            console.log('Error: ' + tx.error.message);
            query_socket.close();
        }
        else
        {
            // Process query response and initiate a new query.
            queries_processed++;
            console.log('Got tx via query: ' + tx.result.transaction.hash + ' at ' + process.hrtime() + ' [' + queries_processed + ']');
            fetch_transaction(transaction_hash);
        }
    }
    else
    {
        console.log('ERROR: Sent request with sequence ' + random + ' and response contains ' + tx.sequence);
    }
});

query_socket.on('close', function(code)
{
    console.log('Query client closed (' + queries_processed + ' queries processed)');
});

query_socket.on('error', function(error)
{
    console.log('Socket error: ');
    console.dir(error);
});
