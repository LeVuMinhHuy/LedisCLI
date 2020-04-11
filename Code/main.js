// Init
var myMap = new Map();
var setType = new Set();
var activeExpire = new Map();

// const testMap = localStorage.getItem('myMap');

const timer = {};
const newExpire = {};

// [...this] :  their data can be unpacked into distinct variables. => array
Set.prototype.getByIndex = function(index) { return [...this][index]; }


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
        SINTER: 'SINTER',
        sinter: 'sinter',
    },
    EXPIRE: {
        KEYS: 'KEYS',
        keys: 'keys',
        DEL: 'DEL',
        del: 'del',
        EXPIRE: 'EXPIRE',
        expire: 'expire',
        TTL: 'TTL',
        ttl: 'ttl',
    },
    SNAPSHOTS: {
        SAVE: 'SAVE',
        save: 'save',
        RESTORE: 'RESTORE',
        restore: 'restore',
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
        case cliType.STRING.SET:
        case cliType.STRING.set:
            ledisSET(arrayCommand);
            break;

        case cliType.STRING.GET:
        case cliType.STRING.get:
            ledisGET(arrayCommand);
            break;

        case cliType.SET.SADD:
        case cliType.SET.sadd:
            ledisSADD(arrayCommand);
            break;

        case cliType.SET.SREM:
        case cliType.SET.srem:
            ledisSREM(arrayCommand);
            break;

        case cliType.SET.SMEMBERS:
        case cliType.SET.smembers:
            ledisSMEMBERS(arrayCommand);
            break;

        case cliType.SET.SINTER:
        case cliType.SET.sinter:
            ledisSINTER(arrayCommand);
            break;
        case cliType.EXPIRE.KEYS:
        case cliType.EXPIRE.keys:
            ledisKEYS(arrayCommand);
            break;

        case cliType.EXPIRE.DEL:
        case cliType.EXPIRE.del:
            ledisDEL(arrayCommand);
            break;

        case cliType.EXPIRE.EXPIRE:
        case cliType.EXPIRE.expire:
            ledisEXPIRE(arrayCommand);
            break;

        case cliType.EXPIRE.TTL:
        case cliType.EXPIRE.ttl:
            ledisTTL(arrayCommand);
            break;

        case cliType.SNAPSHOTS.SAVE:
        case cliType.SNAPSHOTS.save:
            ledisSAVE(arrayCommand);
            break;

        case cliType.SNAPSHOTS.RESTORE:
        case cliType.SNAPSHOTS.restore:
            ledisRESTORE(arrayCommand);
            break;

        case "flushall":
            ledisFLUSHALL();
            break;

        case "clear":
            ledisCLEAR();
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

function checkTimeout(variable){
    if (myMap.has(variable) && activeExpire.has(variable) && activeExpire.get(variable) == -1){
        myMap.delete(variable);
        activeExpire.delete(variable);
        cliNormalReturn("(nil)");
        return 1;
    }

    return 0;
}

function checkManyTimeout(variable){
    if (myMap.has(variable) && activeExpire.has(variable) && activeExpire.get(variable) == -1){
        myMap.delete(variable);
        activeExpire.delete(variable);
        // cliNormalReturn("(nil)");
        return 1;
    }

    return 0;
}

function ledisSET(arrayCommand) {
    if (arrayCommand.length != 3){
        throwError("wrong number of arguments for 'set' command");
        return;
    };

    checkTimeout(arrayCommand[1]);
    // Set lại một setType vẫn được.
    // Ví dụ:
    // sadd a 1 2 3 4
    // set a b
    myMap.set(arrayCommand[1], arrayCommand[2]);
    // Khi chưa expired mà set lại thì sẽ xóa thời gian expire
    if(activeExpire.has(arrayCommand[1])){
        console.log(activeExpire);
        activeExpire.delete(arrayCommand[1]);
        console.log(activeExpire);};


    cliNormalReturn("OK");
    return;
}

function ledisGET(arrayCommand) {
    if (arrayCommand.length != 2){
        throwError("wrong number of arguments for 'get' command");
        return;
    }

    if (!myMap.has(arrayCommand[1])){
        cliNormalReturn("(nil)");
        return;
    }

    if(checkTimeout(arrayCommand[1]) == 1){return;};

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

    if(checkTimeout(arrayCommand[1]) == 1){return;};

    // Chưa có key này? => Thêm set mới
    if (!myMap.has(arrayCommand[1])){

        // Thêm vào myMap có key = "setType" một value = const set chứa các keys của set
        setType.add(arrayCommand[1]);
        myMap.set("setType", setType);

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

    if(checkTimeout(arrayCommand[1]) == 1){return;};

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

    if(checkTimeout(arrayCommand[1]) == 1){return;};

    if (!myMap.has(arrayCommand[1])){
        cliNormalReturn("(empty list or set)");
    }

    else if (typeof myMap.get(arrayCommand[1]) == "string"){
        throwError("WRONGTYPE Operation against a key holding the wrong kind of value");
    }

    else {
        var arrayMemberSet = [];
        var memberSet = myMap.get(arrayCommand[1]);

        for (var i = 0; i < memberSet.size ; i++){
            arrayMemberSet.push(memberSet.getByIndex(i));
        }

        // console.log(arrayMemberSet);
        cliListReturn(arrayMemberSet);
    }

    return;
}

function ledisSINTER(arrayCommand){

    if (arrayCommand.length < 2){
        throwError("wrong number of arguments for 'sinter' command");
        return;
    }

    if (arrayCommand[1] == "*"){
        if (!myMap.has("setType")){cliNormalReturn("(empty list or set)"); return;};

        for (var i = 0 ; i < myMap.get("setType").size ; i++){
            checkManyTimeout(arrayCommand[i+1]);
            arrayCommand[i+1] = myMap.get("setType").getByIndex(i);
        }
    };

    // console.log(arrayCommand);

    if (!myMap.has(arrayCommand[1])) { cliNormalReturn("(empty list or set)"); return;};
    var minSetName = arrayCommand[1];

    // get min size set
    for (var i = 2; i < arrayCommand.length; i++){

        checkManyTimeout(arrayCommand[i]);

        if (!myMap.has(arrayCommand[i])){
            cliNormalReturn("(empty list or set)");
            return;
        }

        if (myMap.get(arrayCommand[i]).size < myMap.get(arrayCommand[i-1]).size){
            minSetName = arrayCommand[i];
        }
    }

    var minSet = myMap.get(minSetName);
    var count = 0;
    var arrayInter = [];
    for (var i = 0; i < minSet.size ; i++){
        for (var j = 1 ; j < arrayCommand.length ; j++){
            if (myMap.get(arrayCommand[j]).has(minSet.getByIndex(i))) {count++;}
        }

        if (count == arrayCommand.length - 1){
            arrayInter.push(minSet.getByIndex(i));
        }

        count = 0;
    }
    if (arrayInter.length == 0){ cliNormalReturn("(empty list or set)"); return;}

    cliListReturn(arrayInter);
}

function ledisKEYS(arrayCommand){
    if (arrayCommand.length != 2){
        throwError("wrong number of arguments for 'keys' command");
        return;
    }

    var allKeys = Array.from(myMap.keys()); // O(N)

    for (var i = 0 ; i < allKeys.length ; i++){
        checkManyTimeout(allKeys[i]);
    }

    var allKeys = Array.from(myMap.keys());

    var arrayKeysOut = [];

    for (var i = 0 ; i < allKeys.length ; i++){
        if (allKeys[i] != "setType"){
            arrayKeysOut.push(allKeys[i]); // O(1)
        }
    }
    // for: O(N)

    if (arrayKeysOut.length == 0){ cliNormalReturn("(empty list or set)"); return;}

    cliListReturn(arrayKeysOut);

}

function ledisDEL(arrayCommand){
    if (arrayCommand.length < 2){
        throwError("wrong number of arguments for 'del' command");
        return;
    }

    // var allKeys = Array.from(myMap.keys()); // O(N)

    // for (var i = 0 ; i < allKeys.length ; i++){
    //     checkManyTimeout(allKeys[i]);
    // }

    // O(N)
    if (arrayCommand[1] == "*"){
        var arrayKeysOut = [];

        var allKeys = Array.from(myMap.keys());

        for (var i = 0 ; i < allKeys.length ; i++){
            if (allKeys[i] != "setType"){
                arrayKeysOut.push(allKeys[i]); // O(1)
            }
        }

        for (var i = 0 ; i < arrayKeysOut.length ; i++){
            arrayCommand[i+1] = arrayKeysOut[i];
        }
    };

    var countDelete = 0;
    for (var i = 1; i < arrayCommand.length; i++){

        if (!myMap.has(arrayCommand[i])){
            continue;
        }

        myMap.delete(arrayCommand[i]);
        if(activeExpire.has(arrayCommand[i])){activeExpire.delete(arrayCommand[i])};

        if(myMap.has("setType")){
            if(myMap.get("setType").has(arrayCommand[i])){myMap.get("setType").delete(arrayCommand[i])};
        }


        countDelete++;
    }

    cliNormalReturn("(integer) " + countDelete);
}

function ledisEXPIRE(arrayCommand){
    if (arrayCommand.length != 3){
        throwError("wrong number of arguments for 'expire' command");
        return;
    }

    if(checkTimeout(arrayCommand[1]) == 1){return;};

    if (!myMap.has(arrayCommand[1])){
        cliNormalReturn("(integer) " + 0);
        return;
    }

    // const timer = {};
    // const newExpire = {};

    // Xóa expire cũ
    if(activeExpire.has(arrayCommand[1])){
        clearInterval(newExpire[arrayCommand[1]]);
        activeExpire.delete(arrayCommand[1]);
    };

    // Nhiều Expire cùng lúc

    timer[arrayCommand[1]] = arrayCommand[2];
    activeExpire.set(arrayCommand[1], timer[arrayCommand[1]]);


    newExpire[arrayCommand[1]] = setInterval(function(){

        if (timer[arrayCommand[1]] == -1) {
            clearInterval(newExpire[arrayCommand[1]]);
            return;
        };

        timer[arrayCommand[1]] -= 1;
        if(activeExpire.has(arrayCommand[1])){
            activeExpire.set(arrayCommand[1], timer[arrayCommand[1]]);
        }
        else{
            return;
        }

        // console.log(timer);
        console.log(activeExpire);

    } , 1000)

    cliNormalReturn("(integer) " + 1);
}

function ledisTTL(arrayCommand){
    if (arrayCommand.length != 2){
        throwError("wrong number of arguments for 'expire' command");
        return;
    }

    if (!myMap.has(arrayCommand[1])){
        cliNormalReturn("(integer) " + -2);
        return;
    }

    checkManyTimeout(arrayCommand[1]);

    if (!activeExpire.has(arrayCommand[1])){
        cliNormalReturn("(integer) " + -1);
    }
    else{
        cliNormalReturn("(integer) " + activeExpire.get(arrayCommand[1]));
    }

}

function ledisSAVE(arrayCommand){
    if (arrayCommand.length != 1){
        throwError("wrong number of arguments for 'save' command");
        return;
    }

    hihi = {'1':'2','2':'3'};
    localStorage.setItem('myMap', JSON.stringify(Array.from(myMap.entries()))); // O(N)
    localStorage.setItem('activeExpire', JSON.stringify(Array.from(activeExpire.entries()))); // O(N)

    cliNormalReturn("OK");
}

function ledisRESTORE(arrayCommand){
    if (arrayCommand.length != 1){
        throwError("wrong number of arguments for 'restore' command");
        return;
    }

    cacheMap = JSON.parse(localStorage.getItem('myMap'));
    cacheActiveExpire = JSON.parse(localStorage.getItem('activeExpire'));

    myMap = new Map();
    activeExpire = new Map();

    //O(M) for for loop with M is keys saved
    for (var i = 0 ; i < cacheMap.length ; i++){
        myMap.set(cacheMap[i][0], cacheMap[i][1]); // O(1)
    }

    //O(N) for for loop with N is keys expiring
    for (var i = 0 ; i < cacheActiveExpire.length ; i++){
        activeExpire.set(cacheActiveExpire[i][0], cacheActiveExpire[i][1]); // O(1)
    }

    // => O(M) + O(N)

    cliNormalReturn("OK");
}

function ledisFLUSHALL(){
    myMap = new Map();
    activeExpire = new Map();
}

function ledisCLEAR(){
    var r = document.getElementById("consoletext");
    r.innerHTML = "Ledis : Le Vu Minh Huy <br> <br>";
}