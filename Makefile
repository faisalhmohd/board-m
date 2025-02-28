.PHONY: help logs

help:
	@echo "Usage:"
	@echo "  make help          Display this help message"
	@echo "  make logs [service]  Display logs for the specified service (frontend or backend)"
	@echo "  make shell [service]  Open a shell in the specified service (frontend or backend)"
	@echo "  make up             Start the development environment"
	@echo "  make down 					Stop the development environment"

logs:
	docker-compose logs -f $(filter-out $@,$(MAKECMDGOALS))

shell:
	docker-compose exec $(filter-out $@,$(MAKECMDGOALS)) /bin/sh

up:
	docker compose -f docker-compose.dev.yml up -d

down:
	docker compose -f docker-compose.dev.yml down