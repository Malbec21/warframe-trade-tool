.PHONY: up down logs build restart clean

up:
	docker-compose --profile with-db up -d --build

up-no-db:
	docker-compose --profile no-db up -d --build

down:
	docker-compose --profile with-db --profile no-db down

logs:
	docker-compose --profile with-db --profile no-db logs -f

build:
	docker-compose --profile with-db build

restart:
	docker-compose --profile with-db --profile no-db restart

clean:
	docker-compose --profile with-db --profile no-db down -v
	rm -rf frontend/dist frontend/node_modules backend/__pycache__

help:
	@echo "Available commands:"
	@echo "  make up        - Start all services with database"
	@echo "  make up-no-db  - Start services without database (memory-only)"
	@echo "  make down      - Stop all services"
	@echo "  make logs      - View logs"
	@echo "  make build     - Rebuild containers"
	@echo "  make restart   - Restart services"
	@echo "  make clean     - Remove all containers and volumes"

