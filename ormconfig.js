export default {
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "password",
    database: "inventory  ",
    entities: [__dirname + "/../**/*.entity.{js,ts}"],
    synchronize: false,
    logging: true
}