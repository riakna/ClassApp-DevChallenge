const fs = require('fs'); 
const parse = require ('csv-parse');
const email_validator = require("email-validator");
const phoneUtil = require ('google-libphonenumber').PhoneNumberUtil.getInstance();

var input_file = 'input.csv';
var tags = [];
var header_processed = false;
var addresses_list = [];
var output = {};

function validate_email(email) {
    if (email_validator.validate(email)) {
        return email;
    }
    return "";
}

function validate_phone(phone) {
    
    try {
        const number = phoneUtil.parseAndKeepRawInput(phone, 'BR');

        if (phoneUtil.isValidNumber(number) && phoneUtil.isPossibleNumber(number)) {
            return number.getCountryCode().toString()+number.getNationalNumber().toString();
        }
        return "";

    } catch (error) {
        return "";
    }
}

function validate_address(address, index) {

    var address_info  = {
        "type": "",
        "tags": [],
        "address" : ""
    }
    for (var i = 0; i < addresses_list.length; i++) {
        var addr = "";
        if (addresses_list[i]["index"] === index) {
            if (addresses_list[i]["type"] === "email") {
                addr = validate_email(address);
            }
            else if (addresses_list[i]["type"] === "phone") {
                addr = validate_phone(address);
            }

            if (addr !== "") {
                address_info["type"] = addresses_list[i]["type"];
                address_info["tags"] = addresses_list[i]["tags"];
                address_info["address"] = addr;
            }
        }
    }

    return address_info;
}

function split_info_field (info) {

    if (info.includes("/")) {
        info = info.split("/")
    }
    else if (info.includes(",")) {
        info = info.split(",")
    }
    else {
        info = info.split()
    }

    for (var i = 0; i < info.length; i++) {
        info[i] = info[i].trim();
    }
    return info;
}

function get_address_type_and_tags(addr, index) {
    addr = addr.split(" ");

    addr_info = {
        "index":index,
        "type": addr[0],
        "tags": []
    }

    for (var i = 1; i < addr.length; i++) {
        addr[i] = addr[i].replace(",", "");
        addr_info["tags"].push(addr[i]);
    }

    return addr_info;
}

function verify_format_boolean_fields(value){
    if(value == "yes" || value == "1") {
        return true;
    }
    else if (value == "no" || value == "0"){
        return false;
    }
    return false;
}

function process_row(row) {

    if (!header_processed) {
        tags = row
        
        for (var i = 2; i < row.length; i++) {
            if (row[i] !== "class") {
                addresses_list.push(get_address_type_and_tags(row[i], i))
            }
        }
        header_processed = true;
    }
    else {
        var person = {
            "fullname":row[0],
            "eid":row[1],
            "classes":[],
            "addresses":[],
            "invisible":false,
            "see_all":false
        };

        for (var i = 2; i < row.length; i++) {
            if (tags[i] === "class" && row[i] !== "") {
                var classes = split_info_field(row[i])
                
                person["classes"] = person["classes"].concat(classes);
            }
            else if (tags[i] == "invisible") {
                person["invisible"] = verify_format_boolean_fields(row[i]);
            }
            else if (tags[i] == "see_all") {
                person["see_all"] = verify_format_boolean_fields(row[i]);
            }
            else {
                var addr_list = split_info_field(row[i]);

                for (var j = 0; j < addr_list.length; j++) {
                    var addr = validate_address(addr_list[j], i);
                    if (addr["address"] !== "") {
                        var isDuplicated = false;
                        for (var index in person["addresses"]) {
                            if(person["addresses"][index]["address"] === addr["address"]) {
                                person["addresses"][index]["tags"] = person["addresses"][index]["tags"].concat(addr["tags"]);
                                isDuplicated = true;
                                break;
                            }
                        }
                        if (!isDuplicated) {
                            person["addresses"].push(addr);
                        }
                    }
                }
            }
        }
        if (person["eid"] in output) {
            output[person["eid"]]["classes"] = output[person["eid"]]["classes"].concat(person["classes"]);
            output[person["eid"]]["addresses"] = output[person["eid"]]["addresses"].concat(person["addresses"]);
            output[person["eid"]]["invisible"] = output[person["eid"]]["invisible"] || person["invisible"];
            output[person["eid"]]["see_all"] = output[person["eid"]]["see_all"] || person["see_all"];
        }
        else {
            output[person["eid"]] = person;
        }
    }
}
var parser = parse({delimiter: ','}, function (err, data) {
    
    data.forEach(process_row)

    var json_array  = []

    for (var key in output) {
        if (output[key]["classes"].length == 1){
            output[key]["classes"] = output[key]["classes"][0];
        }
        json_array.push(output[key])
    }

    const json = JSON.stringify(json_array);

    fs.writeFile("output.json", json, (error) => {
        if (error !== null) {
            console.log(error)
        }
    });
});

fs.createReadStream(input_file).pipe(parser);
