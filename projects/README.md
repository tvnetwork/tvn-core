# TVN Projects

This directory tracks the active software projects, infrastructure components, and open-source tooling built and maintained by the TVN community.

---

## Active Projects

| Project Name | Description | Tech Stack | Status |
| :--- | :--- | :--- | :--- |
| **[Example API](./example-api)** | Core authentication and user management service. | Go, PostgreSQL, Redis | Active |
| **[Builder CLI](./builder-cli)** | Command-line tool for scaffolding TVN compliant projects. | Rust | Beta |

## Project Requirements

Every project hosted or linked within TVN must adhere to the following baseline standards:

1. **Clear Documentation:** Every project must have its own `README.md` explaining local setup, architecture, and environment variables.
2. **Containerization:** Projects should include a `Dockerfile` and `docker-compose.yml` for reproducible local environments.
3. **CI/CD:** Basic GitHub Actions workflows for linting and testing must be present.
4. **Licensing:** All code must be open-source (MIT or Apache 2.0 preferred).

## Adding a Project

To list your project here:
1. Ensure your repository meets the **Project Requirements**.
2. Open a Pull Request modifying the `Active Projects` table above.
3. Include a link to your repository and a brief architectural overview in your PR description.
