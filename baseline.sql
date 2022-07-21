CREATE SCHEMA IF NOT EXISTS `inventory`;

CREATE TABLE `inventory`.`books` (
  `id`              INT             NOT NULL AUTO_INCREMENT,
  `title`           VARCHAR(255)    NOT NULL,
  `isbn`            VARCHAR(255)    NOT NULL,
  `category`        VARCHAR(255)    NOT NULL,
  `inventory`       INT             NOT NULL,
  `price`           DECIMAL(10,2)   NOT NULL,
  `price_override`  DECIMAL(10,2)   NULL DEFAULT NULL,
  `release_date`    DATE            NOT NULL,
  `notes`           VARCHAR(255)    NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `isbn` (`isbn`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `inventory`.`authors` (
    `id`            INT             NOT NULL AUTO_INCREMENT,
    `first_name`    VARCHAR(255)    NOT NULL,
    `last_name`     VARCHAR(255)    NOT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `uc_first_last_name` UNIQUE (`first_name`, `last_name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `inventory`.`authors_books` (
    `author_id`     INT             NOT NULL,
    `book_id`       INT             NOT NULL,
    FOREIGN KEY (`author_id`) REFERENCES `inventory`.`authors` (`id`)
        ON DELETE CASCADE,
    FOREIGN KEY (`book_id`) REFERENCES `inventory`.`books` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


INSERT INTO `inventory`.`authors` (`id`, `first_name`, `last_name`)
VALUES
	(1, 'Jaideva', 'Goswami'),
	(2, 'Abraham', 'Eraly'),
	(3, 'Kurt', 'Vonnegut'),
	(4, 'John', 'Steinbeck'),
	(5, 'Bob', 'Dylan'),
    (6, 'George', 'R. R. Martin');

INSERT INTO `inventory`.`books` (`id`, `title`, `isbn`, `category`, `inventory`, `price`, `release_date`, `notes`)
VALUES
	(1, 'Fundamentals of Wavelets', '3726362789',   'nonfiction',   9,  6.49,   '2019-02-16', NULL),
	(2, 'Age of Wrath, The',        '3876253647',   'nonfiction',   0,  7.33,   '2014-01-01', 'Backorder until the end of the year'),
	(3, 'Slaughterhouse Five',      '0983746523',   'fiction',      3,  1.29,   '1969-03-31', NULL),
	(4, 'Moon is Down, The',        '37463567283',  'fiction',      12, 3.99,   '1942-03-06', NULL),
	(5, 'Dylan on Dylan',           '28710924383',  'nonfiction',   12, 4.99,   '1962-03-19', NULL),
	(6, 'Journal of a Novel',       '239847201093', 'fiction',      8,  5.69,   '1969-01-01', 'Reorder in November'),
    (7, 'The Winds of Winter',      'xxxxxxxxxxxx', 'fantasy',      0,  24.99,  '2099-01-01', 'Pre-order underway');

INSERT INTO `inventory`.`authors_books` (`author_id`, `book_id`)
VALUES
	(1, 1),
	(2, 2),
	(3, 3),
	(4, 4),
	(5, 5),
	(4, 6),
    (6, 7);
