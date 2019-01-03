/*
  @licstart The following is the entire license notice for the
  JavaScript code in this page.

  Copyright (C) 2018  Neill Miller (neillm@thecodefactory.org)

  The JavaScript code in this page is free software: you can
  redistribute it and/or modify it under the terms of the GNU General
  Public License (GNU GPL) as published by the Free Software
  Foundation, either version 3 of the License, or (at your option) any
  later version.  The code is distributed WITHOUT ANY WARRANTY;
  without even the implied warranty of MERCHANTABILITY or FITNESS FOR
  A PARTICULAR PURPOSE.  See the GNU GPL for more details.

  As additional permission under GNU GPL version 3 section 7, you may
  distribute non-source (e.g., minimized or compacted) forms of that
  code without the copy of the GNU GPL normally required by section 4,
  provided you include this license notice and a URL through which
  recipients can access the Corresponding Source.

  @licend The above is the entire license notice for the JavaScript
  code in this page.
*/
var query_ws = null;
var height_ws = null;
var satoshi_per_btc = 100000000;
var block_list = [];
var height_list = [];
var transaction_list = [];
var max_visible_blocks = 5;
var max_visible_transactions = 10;

function get_url_parameter(param)
{
    let vars = {};
    if (param)
    {
        let selector = function(m, key, value)
        {
            vars[key] = value !== undefined ? value : '';
        };

        window.location.href.replace(location.hash, '').replace(
                /[?&]+([^=&]+)=?([^&]*)?/gi, selector);

        return vars[param] ? vars[param] : null;
    }
    return vars;
}

function handle_transaction(tx)
{
    let num_inputs = tx.result.transaction.inputs.length;
    let num_outputs = tx.result.transaction.outputs.length;

    let value = 0;
    tx.result.transaction.outputs.forEach(function(output)
    {
        value += parseInt(output.value);
    });

    value = parseFloat(value / satoshi_per_btc).toFixed(8);

    let url = '<a target="blank_" href="fetch-tx.html?hash=' +
        tx.result.transaction.hash + '">' + tx.result.transaction.hash + '</a>';
    let row = '<tr><td>' + url + '</td><td>' + value + '</td><td>' +
        num_inputs + '</td><td>'+ num_outputs + '</td><td>' +
        new Date().toLocaleString() + '</td></tr>';

    transaction_list.push(row);
    if (transaction_list.length > max_visible_transactions)
        transaction_list.shift();

    let tx_data = '';
    for (var i = transaction_list.length - 1; i >= 0; --i)
        tx_data += transaction_list[i];

    $('#transactions').html(tx_data);
}

function fetch_height_from_block_hash(url, hash, height_container_id)
{
    console.log('fetch_height_from_block_hash called with ' + hash +
                ' and ' + height_container_id);

    if (!$('#' + height_container_id).length)
        return;

    if (height_ws == null)
    {
        height_ws = new WebSocket(url);

        height_ws.onopen = function (event)
        {
            console.log('Height client connected');
            let height_request = JSON.stringify({
                'id' : parseInt(Math.random() * 1000000),
                'method' : 'getblockheight',
                'params' : [ hash ] });

            height_ws.send(height_request);
            console.log('Sent query: ' + height_request);
        };

        height_ws.onmessage = function(message)
        {
            console.log('Got height ' + message.data);
            let json = JSON.parse(message.data);

            height_list.push({
                id: height_container_id,
                hash: hash,
                height: json.result
            });

            if (height_list.length > max_visible_blocks)
                height_list.shift();

            $('#' + height_container_id).html(json.result);
        };

        height_ws.onclose = function(message)
        {
            height_ws = null;
        };

        height_ws.onerror = function(message)
        {
            console.log('Socket error: ');
            console.dir(message);
            height_ws = null;
        };
    }
    else
    {
        // If already connected, just update the respinse handler and
        // issue the query request.
        height_ws.onmessage = function(message)
        {
            console.log('Got height ' + message.data);
            let json = JSON.parse(message.data);

            height_list.push({
                id: height_container_id,
                hash: hash,
                height: json.result
            });

            if (height_list.length > max_visible_blocks)
                height_list.shift();

            $('#' + height_container_id).html(json.result);
        };

        let height_request = JSON.stringify({
            'id' : parseInt(Math.random() * 1000000),
            'method' : 'getblockheight',
            'params' : [ hash ] });

        height_ws.send(height_request);
        console.log('Sent query: ' + height_request);
    }
}

function handle_block(block, query_url)
{
    let block_hash = block.result.header.hash;
    let height_container_id = block_hash + '-height';

    let height = $('#' + height_container_id).html();
    let time_stamp = new Date(
        block.result.header.time_stamp * 1000).toLocaleString();
    let version = block.result.header.version;
    let url = '<a target="blank_" href="fetch-header.html?hash=' +
        block_hash + '">' + block.result.header.hash + '</a>';
    let row = '<tr><td><span id="' + height_container_id +
        '">' + height + '</span></td>><td>' + url + '</td><td>' + time_stamp +
        '</td><td>' + version + '</td></tr>';

    block_list.push(row);
    if (block_list.length > max_visible_blocks)
        block_list.shift();

    let block_data = '';
    for (var i = block_list.length - 1; i >= 0; --i)
        block_data += block_list[i];

    $('#blocks').html(block_data);

    // Fetch and set the current block height
    fetch_height_from_block_hash(query_url, block_hash, height_container_id);

    // Set the heights of the other blocks by using a previously
    // retrieved value.
    height_list.forEach(function(heightInfo)
    {
        if (heightInfo.height != 'undefined')
            $('#' + heightInfo.id).html(heightInfo.height);
    });
}

function handle_heartbeat(heartbeat)
{
    let url = '<a target="blank_" href="fetch-height.html">' +
        heartbeat.height + '</a>';
    let row = '<tr><td>' + new Date().toLocaleString() +
        '</td>><td>' + url + '</td></tr>';

    $('#heartbeats').html(row);
}

function start_heartbeat_subscription(url)
{
    console.log('Heartbeat trying to open: ' + url);
    let ws = new WebSocket(url);

    ws.onopen = function (event)
    {
        console.log('Heartbeat client connected');
    };

    ws.onmessage = function(message)
    {
        let json = JSON.parse(message.data);
        handle_heartbeat(json);
    };

    ws.onclose = function(message)
    {
    };

    ws.onerror = function(message)
    {
        console.log('Socket error: ');
        console.dir(message);
    };
}

function start_transaction_subscription(url)
{
    console.log('Transaction trying to open: ' + url);
    let ws = new WebSocket(url);

    ws.onopen = function (event)
    {
        console.log('Transaction client connected');
    };

    ws.onmessage = function(message)
    {
        // console.log(message.data);
        let json = JSON.parse(message.data);
        handle_transaction(json);
    };

    ws.onclose = function(message)
    {
    };

    ws.onerror = function(message)
    {
        console.log('Socket error: ');
        console.dir(message);
    };
}

function start_block_subscription(url)
{
    console.log('Block trying to open: ' + url);
    let ws = new WebSocket(url);

    ws.onopen = function (event)
    {
        console.log('Block client connected');
    };

    ws.onmessage = function(message)
    {
        let json = JSON.parse(message.data);
        // NOTE: If using secure only, this needs to be modified (Use
        // SECURE_QUERY_SERVICE_URL instead).
        handle_block(json, PUBLIC_QUERY_SERVICE_URL);
    };

    ws.onclose = function(message)
    {
    };

    ws.onerror = function(message)
    {
        console.log('Socket error: ');
        console.dir(message);
    };
}

function issue_query(json_request, container)
{
    // initiate query request
    query_ws.send(json_request);
}

function start_query(url, open_handler, close_handler,
    data_handler, error_handler)
{
    query_ws = new WebSocket(url);
    query_ws.onopen = open_handler;
    query_ws.onclose = close_handler;
    query_ws.onmessage = data_handler;
    query_ws.onerror = error_handler;
}
