CREATE TABLE IF NOT EXISTS importances (
	id          INTEGER UNSIGNED AUTO_INCREMENT,
	color       VARCHAR(20) NOT NULL,
	`level`     INTEGER UNSIGNED NOT NULL,
	`desc`      VARCHAR(50) NOT NULL,
	PRIMARY KEY (id),
	UNIQUE (level)
);

CREATE TABLE IF NOT EXISTS todos (
	id          INTEGER UNSIGNED AUTO_INCREMENT,
	importance  INTEGER UNSIGNED NOT NULL,
	title       VARCHAR(100) NOT NULL,
	body        VARCHAR(200) NOT NULL,
	days        INTEGER UNSIGNED NOT NULL,
	hidden      BOOLEAN DEFAULT FALSE,
	ts          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	FOREIGN KEY (importance) REFERENCES importances(id)
);

CREATE TABLE IF NOT EXISTS recently_hidden (
	id         INTEGER UNSIGNED AUTO_INCREMENT,
	todo_id    INTEGER UNSIGNED NOT NULL,
	ts         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sessions (
	id        INTEGER UNSIGNED AUTO_INCREMENT,
	unique_id VARCHAR(30) NOT NULL,
	has_login BOOLEAN DEFAULT FALSE,
	ts        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id),
	UNIQUE (unique_id)
);

CREATE OR REPLACE VIEW ordered_todos AS
SELECT
	todos.id           AS id,
	importances.`desc` AS importance,
	todos.title        AS title,
	todos.body         AS body,
	CAST(todos.days AS SIGNED) - DATEDIFF(NOW(), ts) AS days_left,
	todos.ts           AS ts,
	CAST(importances.`level` AS SIGNED) * POW(0.4, CAST(todos.days AS SIGNED) - DATEDIFF(NOW(), ts)) AS urgency
FROM todos
	INNER JOIN importances 
		ON todos.importance = importances.id
WHERE
	NOT hidden
ORDER BY
	urgency DESC;
