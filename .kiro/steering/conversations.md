# Conversation Guidelines

## Language & Response Style

- **Primary Language**: Japanese (日本語)
- **Code Comments**: English or Japanese as appropriate
- **Documentation**: Japanese for user-facing content, English for technical specifications

## Output Restrictions

- **Do NOT output spec files** in responses to user queries
- **Do NOT generate specification documents** unless explicitly requested by the user
- **Do NOT create .md files for specs** as part of standard workflow
- Specs should only be created when the user specifically asks for them

## Response Format

- Provide concise, direct answers in Japanese
- Use bullet points for clarity when listing items
- Include code examples with minimal explanation
- Focus on actionable information over lengthy descriptions

## When Working with Specs

- If a user requests a spec, create it in `.kiro/specs/` directory
- Use the spec format: `requirements.md`, `design.md`, `implementation.md`
- Do not automatically generate specs for routine tasks
- Only create specs for complex features or when explicitly requested

## Code & Technical Content

- Use English for code variable names, function names, and comments
- Use Japanese for user-facing UI text and documentation
- Maintain consistency with existing codebase conventions
