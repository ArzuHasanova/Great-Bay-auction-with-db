const mysql = require('mysql2');
const inquirer = require('inquirer');

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    port: 3306,
    password: 'arzu1234',
    database: 'greatbay_db'
});


const run = () => {
    inquirer
        .prompt({
            name: 'command',
            type: 'input',
            message: 'What would you like to do?',
            choices: ['Post', 'Bid'],
        })
        .then((answer) => {
            switch(answer.command){
                case "Post":
                    postItem();
                    break;
                case "Bid":
                    bidOnItem();
                    break;  
            }
        })
}
const postItem = () => {

    inquirer
        .prompt([{
                name: 'item',
                type: 'input',
                message: 'Enter the name of your item',
            },
            {
                name: 'category',
                type: 'input',
                message: 'Enter the category for your item',
            },
            {
                name: 'startingBid',
                type: 'input',
                message: 'Enter the starting bid for your item',
                validate(value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                },
            },
        ])
        .then((answer) => {
            conn.query('INSERT INTO auctions SET?', {
                item_name: answer.item,
                category: answer.category,
                starting_bid: answer.startingBid || 0,
                highest_bid: answer.startingBid || 0,
            }, (err) => { if (err) throw err; })
            run();
        });
};

const bidOnItem = () => {
    conn.query('SELECT * FROM auctions', (err, results) => {

        inquirer.prompt([
            {
            name: 'choice',
            type: 'rawlist',
            message: 'Which item would you like to bid on?',
            choices() {
                let bidChoices = [];
                results.forEach(({ item_name }) => {
                    bidChoices.push(item_name);
                });
                return bidChoices;
            },
        }, 
        {
            name: 'bid',
            type: 'input',
            message: 'How much would you like to bid?',
        }]).then((answer) => {
            let chosenItem;
            results.forEach((item) => {
                if (item.item_name === answer.choice) {
                    chosenItem = item;
                }
            });

            if (parseInt(answer.bid) <= chosenItem.highest_bid) {
                console.log('Your bid was too low!')
                run();
            } else if (answer.bid > chosenItem.highest_bid) {
                conn.query('UPDATE auctions SET ? WHERE ?', [{
                    highest_bid: answer.bid
                }, {
                    id: chosenItem.id,
                }], (error) => {
                    if (error) throw err;
                    console.log('Bid replaced successfully!');
                    run();
                });
            }
        });
    });
}

conn.connect((err) => {
    if (err) throw err;
    run();
});