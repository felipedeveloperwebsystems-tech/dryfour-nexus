// ============================================================
// DRYFOUR NEXUS — database/connection.go
// Conexão com Neon PostgreSQL via pgx/v5
// Pool de conexões configurado para Railway/Vercel
// ============================================================

package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB é o pool global de conexões
var DB *pgxpool.Pool

// Connect inicializa o pool de conexões com o Neon PostgreSQL
func Connect(databaseURL string) error {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return fmt.Errorf("parsing database URL: %w", err)
	}

	// Configurações otimizadas para Neon (serverless PostgreSQL)
	config.MaxConns             = 10
	config.MinConns             = 1
	config.MaxConnLifetime      = 30 * time.Minute
	config.MaxConnIdleTime      = 5 * time.Minute
	config.HealthCheckPeriod    = 1 * time.Minute
	config.ConnConfig.ConnectTimeout = 10 * time.Second

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return fmt.Errorf("creating connection pool: %w", err)
	}

	// Verifica conectividade
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return fmt.Errorf("pinging database: %w", err)
	}

	DB = pool
	log.Printf("[DB] Pool conectado — max_conns: %d", config.MaxConns)
	return nil
}

// Close encerra o pool de conexões gracefully
func Close() {
	if DB != nil {
		DB.Close()
		log.Println("[DB] Pool de conexões encerrado")
	}
}

// IsConnected retorna true se o pool está disponível
func IsConnected() bool {
	return DB != nil
}

// ================================================================
// SCHEMA SQL — Executar no Neon para criar as tabelas
// ================================================================
//
// CREATE TABLE IF NOT EXISTS posts (
//   id          SERIAL PRIMARY KEY,
//   title       VARCHAR(255) NOT NULL,
//   slug        VARCHAR(255) UNIQUE NOT NULL,
//   excerpt     TEXT,
//   content     TEXT,
//   niche       VARCHAR(50)  NOT NULL DEFAULT 'default',
//   author      VARCHAR(100) NOT NULL DEFAULT 'NEXUS Editorial',
//   img_url     TEXT,
//   read_time   INT DEFAULT 5,
//   views       INT DEFAULT 0,
//   comments    INT DEFAULT 0,
//   is_featured BOOLEAN DEFAULT FALSE,
//   is_popular  BOOLEAN DEFAULT FALSE,
//   published_at TIMESTAMPTZ DEFAULT NOW(),
//   created_at  TIMESTAMPTZ DEFAULT NOW(),
//   updated_at  TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE INDEX IF NOT EXISTS idx_posts_niche       ON posts(niche);
// CREATE INDEX IF NOT EXISTS idx_posts_published   ON posts(published_at DESC);
// CREATE INDEX IF NOT EXISTS idx_posts_popular     ON posts(views DESC);
// CREATE INDEX IF NOT EXISTS idx_posts_slug        ON posts(slug);
