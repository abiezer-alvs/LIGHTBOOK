const mysql = require('mysql');

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: ""
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Conectado ao servidor MySQL!");

    con.query("CREATE DATABASE IF NOT EXISTS lightbook", function (err, result) {
        if (err) throw err;
        console.log("Banco de dados criado com sucesso!");
    });
    con.end();
});