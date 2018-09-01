/*Classes*/
class Address {
    constructor(type) {
        this.type = type;
        this.tags = [];
        this.addr = "";
    }
    addTag(tag) {
        return this.tags.push(tag);
    }
}

class Info {
    constructor (fullname, eid) {
        this.fullname = fullname;
        this.eid = eid;
        this.classes = [];
        this.addresses = [];
        this.invisible = false;
        this.see_all = false;
    }

    addClass (clss) {
        clss = clss.replace(/[\"]/, "");
        clss = clss.trim();
        if (clss != ""){
            this.classes.push(clss);
        }
    }

    addAddress (type, tags, addr) {
        const address = new Address(type);

        for(var i = 0; i < tags.length; ++i) {
            address.addTag(tags[i])
        }

        if(type == "email") {
            addr = veryfyAndFormatEmail(addr);
        }
        else if(type == "phone") {
            addr = verifyAndFormatTelephoneNumber(addr);
        }
        var addNew = true;
        if(addr != ""){

            for (var i = 0; i < this.addresses.length; ++i) {
                if (this.addresses[i].type == type && this.addresses[i].addr == addr) {
                    addNew = false;

                    for (var j = 0; j < tags.length; ++j) {
                        this.addresses[i].tags.push(tags[j]);
                    }
                    break;
                }
            }

            if (addNew == true) {
                address.addr = addr;
                this.addresses.push(address);
            }
        }
    }

    setBooleanField (field, value) {
        if (value != "") {
            value = verifyAndFormatBooleanFields(value);
            if (field == "invisible" && value) {
                this.invisible = value;
            }
            else if (field == "see_all") {
                this.see_all = value;
            }
        }
    }
}
/*End classes*/

/*Auxiliar Functions*/
//Verify if email is valid, cannot have more than one @ and need to finish with .com or .com.xx. Otherwise returns empty string
function veryfyAndFormatEmail(email){
    var fields = email.split("@")
    if(fields.length != 2) {
        return ""
    }
    var sulfix = fields[1].split(".");
    if(sulfix.length >= 2){
        if(sulfix[1] == "com"){
            return email
        }
    }
    else{
        return "";
    }
    return "";
}

//Verify if is valid phone number, if not return empty string, if yes group the numbers and add 55 in the beginning
function verifyAndFormatTelephoneNumber(number){
    
    number = number.replace(/[\s+()]/g, '');
    
    if((number.length==10  && number[2] != '9')|| (number.length==11 && number[2] == '9')) {
        number = "55"+number;
    }
    else{
        return "";
    }
    return number;
}

function verifyAndFormatBooleanFields(value){
    if(value == "yes" || value == "1") {
        return true;
    }
    else if (value == "no" || value == "0"){
        return false;
    }
    return false;
}

//Create string in json format
function formatJsonString(jsonDict, header) {

    let keys = Object.keys(jsonDict);
    var jsonString = "[";

    for (var i = 0; i < keys.length; ++i) {

        var key = keys[i];
        jsonString += "{\"" + header[0] + "\":\"" + jsonDict[key].fullname[0] + "\",";
        jsonString += "\"" + header[1] + "\":\"" + jsonDict[key].eid[0] + "\",";
        if (jsonDict[key].classes.length > 1){
            jsonString += "\"classes\":[";
            let size = jsonDict[key].classes.length;
            for (var j = 0; j < size; ++j) {
                jsonString += "\""+ jsonDict[key].classes[j]+"\""
                if (j < size-1){
                    jsonString += ", ";
                }
            }
            jsonString += "],";
        }
        else {
            jsonString += "\"classes\":" + "\""+jsonDict[key].classes[0] + "\",";
        }
        jsonString += "\"addresses\":[";
        
        let size = jsonDict[key].addresses.length;
        for (var j = 0; j < size; ++j) {
            jsonString += "{\"type\":\""+ jsonDict[key].addresses[j].type+"\",";
            jsonString += "\"tags\":[";
            for (var k = 0; k < jsonDict[key].addresses[j].tags.length; ++k) {
                jsonString += "\""+ jsonDict[key].addresses[j].tags[k]+"\"";
                if (k < jsonDict[key].addresses[j].tags.length-1) {
                    jsonString += ",";
                }
            }
            jsonString += "],\"address\":\""+ jsonDict[key].addresses[j].addr+"\"}"
            if (j < size-1) {
                jsonString += ",";
            }
        }
        jsonString += "],";

        jsonString += "\"invisible\":" + jsonDict[key].invisible+",";
        jsonString += "\"see_all\":" + jsonDict[key].see_all+"}";

        if (i < keys.length-1) {
            jsonString += ",";
        }
    }
    jsonString += "]";

    return jsonString;
}
/*End Auxiliar Functions*/

/*Main program*/
const fs = require('fs')

const path = __dirname + '/input.csv'

let content = fs.readFileSync(path, 'utf-8').toString().split('\n')

var header = content[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

var jsonDict = {}

for (var i = 4; i < 10; ++i){
    header[i] = header[i].split(" ");
    for(var j = 0; j < header[i].length; ++j){
        header[i][j] = header[i][j].replace(/[,+ +"+]/, "");
    }
}

for(var i = 1; i < content.length; ++i) {

    var line = content[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    
    //split each field by ',' or '/'
    for(var j = 0; j < line.length; ++j) {
        line[j] = line[j].split(/[,/]/);
    }
    
    if(jsonDict[line[0]] == null) {
        //Store info in class Info
        const info = new Info(line[0], line[1]);
    
        for(var k = 0; k < line[2].length; ++k) {
            info.addClass(line[2][k]);
        }
        for(var k = 0; k < line[3].length; ++k) {
            info.addClass(line[3][k]);
        }
        for(var k = 4; k < 10; ++k){
            let tags = [];
            for(var l=1; l < header[k].length; ++l) {
                tags.push(header[k][l]);
            }
            for(var l=0; l < line[k].length; ++l) {
                info.addAddress(header[k][0], tags, line[k][l]);
            }
        }

        info.setBooleanField("invisible", line[10]);
        info.setBooleanField("see_all", line[11]);
        jsonDict[line[0]] = info;
    }
    else {
        for(var k = 0; k < line[2].length; ++k) {
            jsonDict[line[0]].addClass(line[2][k]);
        }
        for(var k = 0; k < line[3].length; ++k) {
            jsonDict[line[0]].addClass(line[3][k]);
        }
        for(var k = 4; k < 10; ++k){
            let tags = [];
            for(var l=1; l < header[k].length; ++l) {
                tags.push(header[k][l]);
            }
            for(var l=0; l < line[k].length; ++l) {
                jsonDict[line[0]].addAddress(header[k][0], tags, line[k][l]);
            }
        }
        jsonDict[line[0]].setBooleanField("invisible", line[10]);
        jsonDict[line[0]].setBooleanField("see_all", line[11]);
    }
}

//Formatting json string and creating output file
let jsonString = formatJsonString(jsonDict, header);
fs.writeFile("output.json", jsonString, (error) => {});