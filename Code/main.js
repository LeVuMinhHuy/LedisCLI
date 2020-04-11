const myMap = new Map();

const cliType = {
    STRING: {
        GET: "GET",
        get: "get",
        SET: "SET",
        set: "set",
    },
    SET: {
        SADD: 'SADD',
        sadd: 'sadd',
        SREM: 'SREM',
        srem: 'srem',
        SMEMBERS: 'SMEMBERS',
        smembers: 'smembers',
    }
}

function checkInput() {
    var event = window.event || event.which;

    if (event.keyCode == 13) {
        event.preventDefault();

        var re = getInput();

        console.log(myMap);
    }
}

function getInput(){
    var command = document.getElementById("textinput").value;

// why /^\s+|\s+$/g, '' ? read this:
// https://stackoverflow.com/questions/25218677/javascript-split-function-to-split-into-array-at-new-line-or-white-space
    var arrayCommand = command.replace(/^\s+|\s+$/g, '').split(/\s+/);

    addLine("> " + command);

//  Xóa textarea
    document.getElementById("textinput").value="";


    switch(arrayCommand[0]){
        // =================== SET / GET =================== //
        case cliType.STRING.SET:
        case cliType.STRING.set:
            ledisSET(arrayCommand);
            break;

        case cliType.STRING.GET:
        case cliType.STRING.get:
            ledisGET(arrayCommand);
            break;

        // ================= SADD ================= //

        case cliType.SET.SADD:
        case cliType.SET.sadd:
            ledisSADD(arrayCommand);
            break;

        //=================== SREM ==================//

        case cliType.SET.SREM:
        case cliType.SET.srem:
            ledisSREM(arrayCommand);
            break;

        //================= SMEMBERS ==================//
        case cliType.SET.SMEMBERS:
        case cliType.SET.smembers:
            ledisSMEMBERS(arrayCommand);
            break;

        case "":
            break;

        default:
            throwError("unknown command '" + command + "'");
    }

    return 0;
}

function addLine(command) {
    var r = document.getElementById("consoletext");
    command = command + '<br>';
    r.innerHTML += command;
}

function cliNormalReturn(result){
    var r = document.getElementById("consoletext");
    result = result + '<br>';
    r.innerHTML += result;
}

function cliListReturn(result){
    var r = document.getElementById("consoletext");
    var listOut = "";
    for (var i = 0 ; i < result.length ; i++){
        var j = i + 1;
        listOut += j + ")  \"" + result[i]  + "\"" + "<br>";
    }

    r.innerHTML += listOut;
}

function throwError(cause){
    var r = document.getElementById("consoletext");
    cause = "ERROR: " + cause + '<br>';
    r.innerHTML += cause;
}

function ledisSET(arrayCommand) {
    if (arrayCommand.length < 3){
        throwError("wrong number of arguments for 'set' command");
        return;
    };

    // Set lại một setType vẫn được.
    // Ví dụ:
    // sadd a 1 2 3 4
    // set a b
    myMap.set(arrayCommand[1], arrayCommand[2]);

    cliNormalReturn("OK");
    return;
}

function ledisGET(arrayCommand) {
    if (arrayCommand.length != 2){
        throwError("wrong number of arguments for 'get' command");
        return;
    }
    // Không thể  get một setType
    if(typeof myMap.get(arrayCommand[1]) != "string" ){
        throwError("WRONGTYPE Operation against a key holding the wrong kind of value");
        return;
    }

    result = myMap.get(arrayCommand[1]);
    // result type vân là string, thêm "" để giống redis cli.
    result = "\"" + result + "\"";
    cliNormalReturn(result);
    return;
}

function ledisSADD(arrayCommand) {
    if (arrayCommand.length < 3){
        throwError("wrong number of arguments for 'sadd' command");
        return;
    }

    // Chưa có key này? => Thêm set mới
    if (!myMap.has(arrayCommand[1])){
        var countDataIn = 0;
        const newSet = new Set();
        for (var i = 2; i < arrayCommand.length ; i++){
            newSet.add(arrayCommand[i]);
        }
        myMap.set(arrayCommand[1], newSet);

        // Return ra cli size của set vì add đúng = size
        cliNormalReturn("(integer) " + newSet.size);
    }

    // Không thể thêm vào một key type là string đã có sẵn bằng lệnh sadd
    else if (typeof myMap.get(arrayCommand[1]) == "string"){
        throwError("WRONGTYPE Operation against a key holding the wrong kind of value");
    }

    else {
        var countDataIn = myMap.get(arrayCommand[1]).size;
        for (var i = 2; i < arrayCommand.length ; i++){
            myMap.get(arrayCommand[1]).add(arrayCommand[i]);
        }

        // thêm = size mới - size cũ
        countDataIn = myMap.get(arrayCommand[1]).size - countDataIn;

        cliNormalReturn("(integer) " + countDataIn);
    }

    return;
}

function ledisSREM(arrayCommand) {
    if (arrayCommand.length < 3){
        throwError("wrong number of arguments for 'srem' command");
        return;
    }

    // Xóa một set chưa tồn tại, vân trả về cli là integer 0
    if (!myMap.has(arrayCommand[1])){
        cliNormalReturn("(integer) " + 0);
    }

    // Không thể xóa một key type = string
    else if (typeof myMap.get(arrayCommand[1]) == "string"){
        throwError("WRONGTYPE Operation against a key holding the wrong kind of value");
    }

    else {
        var countDataOut = myMap.get(arrayCommand[1]).size;

        for (var i = 2; i < arrayCommand.length ; i++){
            myMap.get(arrayCommand[1]).delete(arrayCommand[i]);
        }

        countDataOut = countDataOut - myMap.get(arrayCommand[1]).size;

        // out = size cũ - size mới
        cliNormalReturn("(integer) " + countDataOut);
    }


    return;
}

function ledisSMEMBERS(arrayCommand) {
    if (arrayCommand.length != 2){
        throwError("wrong number of arguments for 'smembers' command");
        return;
    }

    if (!myMap.has(arrayCommand[1])){
        cliNormalReturn("(empty list or set)");
    }

    else if (typeof myMap.get(arrayCommand[1]) == "string"){
        throwError("WRONGTYPE Operation against a key holding the wrong kind of value");
    }

    else {
        var arrayMemberSet = [];
        var memberSet = myMap.get(arrayCommand[1]);

        // [...this] :  their data can be unpacked into distinct variables. => array
        Set.prototype.getByIndex = function(index) { return [...this][index]; }

        for (var i = 0; i < memberSet.size ; i++){
            arrayMemberSet.push(memberSet.getByIndex(i));
        }

        // console.log(arrayMemberSet);
        cliListReturn(arrayMemberSet);
    }

    return;
}