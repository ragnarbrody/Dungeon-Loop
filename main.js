import { installInput } from './src/ui/input.js';
import { loop } from './src/core/loop.js';

// O jogo precisa começar renderizando o menu
// A função loop chama o requestAnimationFrame internamente, então não precisamos chamar de novo aqui
installInput();
requestAnimationFrame(loop);