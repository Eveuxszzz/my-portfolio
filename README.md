# My Portfolio

A modern, responsive portfolio website built with React and TypeScript.

## Features

- **React 18** with TypeScript support
- **Vite** for fast development and builds
- **Responsive design** that works on all devices
- **Modern CSS** with Tailwind CSS
- **Component-based architecture**
- **Smooth animations and transitions**
- **GitHub-style navigation**
- **Contact form** (currently static)

## Live Demo

[Visit the live demo](https://yourusername.github.io/my-portfolio)

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Styling**: Custom CSS with Tailwind utilities
- **Routing**: React Router DOM
- **Code Quality**: ESLint with TypeScript support
- **Build Tool**: Vite

## Project Structure

```
my-portfolio/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Header.tsx
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── About.tsx
│   │   ├── Projects.tsx
│   │   └── Contact.tsx
│   ├── index.tsx           # React entry point
│   ├── App.tsx             # Main app component
│   ├── index.css           # Global styles
│   └── App.css             # Component styles
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## Development Workflow

1. **GitHub Repository**: Create a new public repository named `my-portfolio` on GitHub
2. **Initialize local repo**: `git init` in the project root
3. **Configure remote**: `git remote add origin https://github.com/yourusername/my-portfolio.git`
4. **Push initial commit**: `git push -u origin main` (after adding your GitHub credentials)
5. **Enable GitHub Pages**: Go to repository Settings → General → GitHub Pages and select the `main` branch
6. **Set custom domain** (optional): In GitHub Pages settings

## Deployment

### GitHub Pages

The project is configured for deployment to GitHub Pages:

1. Build the project: `npm run build`
2. The output will be in the `dist/` folder
3. Push the `dist/` folder contents to the `gh-pages` branch (or configure automatic deployment)

### Alternative Hosting

You can also deploy to other platforms like:

- Vercel
- Netlify
- AWS Amplify
- Azure Static Web Apps

## Project Configuration

### TypeScript Configuration

The project uses a comprehensive `tsconfig.json` with:

- Strict mode enabled
- DOM and ES2020 library support
- JSX configuration for React
- Source maps for development

### ESLint Configuration

Linting is configured with:

- TypeScript support
- React hooks rules
- Code quality standards

## Customization

To customize your portfolio:

1. **Update package.json** with your name and project details
2. **Modify components** in `src/components/`
3. **Add new pages** in `src/pages/`
4. **Update styles** in `src/App.css`
5. **Change project data** in `Projects.tsx`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This portfolio project is open source. Feel free to use, modify, and distribute it.

## Acknowledgements

- Powered by [React](https://reactjs.org/)
- Built with [Vite](https://vitejs.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Hosted on [GitHub Pages](https://pages.github.com/)

## Author

Built with ❤️ by your name

## Security Note

- This is a public portfolio project
- All dependencies are from official sources
- Regular security updates are recommended
- Consider adding a security policy for the contact form