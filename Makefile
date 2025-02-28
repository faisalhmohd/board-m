.PHONY: help logs

help:
	@echo "Usage:"
	@echo "  make help          Display this help message"
	@echo "  make logs [service]  Display logs for the specified service (frontend or backend)"

logs:
	docker-compose logs -f $(filter-out $@,$(MAKECMDGOALS))