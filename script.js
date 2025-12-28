document.addEventListener('DOMContentLoaded', function() {
    // КЭШИРОВАНИЕ DOM-ЭЛЕМЕНТОВ
    const DOM = {
        navLinks: document.querySelectorAll('.nav-link'),
        sections: document.querySelectorAll('.section'),
        sidebar: document.querySelector('.sidebar'),
        overlay: document.querySelector('.overlay'),
        mobileToggle: document.querySelector('.mobile-toggle'),
        musicBtn: document.getElementById('musicBtn'),
        bgMusic: document.getElementById('bgMusic'),
        footerCubes: document.getElementById('footerCubes'),
        volumeSlider: document.getElementById('volumeSlider'),
        volumeValue: document.getElementById('volumeValue'),
        refreshNewsBtn: document.getElementById('refreshNewsBtn')
    };
    
    // ПОЛУЧАЕМ ИКОНКУ КНОПКИ МЕНЮ
    const mobileIcon = DOM.mobileToggle ? DOM.mobileToggle.querySelector('i') : null;
    
    // СОСТОЯНИЕ
    let isMenuOpen = false;
    let isFirstInteraction = true;
    let isNewsSectionActive = false;

    // ============================
    // ЗАГРУЗКА НОВОСТЕЙ ИЗ JSON
    // ============================
    
    async function loadNews() {
        // Защита от множественных одновременных запросов
        if (window.isLoadingNews) {
            console.log('Новости уже загружаются...');
            return;
        }
        
        try {
            window.isLoadingNews = true;
            
            const newsContainer = document.getElementById('newsContainer');
            
            if (!newsContainer) {
                console.error('Контейнер новостей не найден!');
                window.isLoadingNews = false;
                return;
            }
            
            // Показываем индикатор загрузки
            if (DOM.refreshNewsBtn) {
                DOM.refreshNewsBtn.classList.add('spinning');
            }
            
            // Показываем сообщение о загрузке в контейнере
            newsContainer.innerHTML = `
                <div class="news-card">
                    <div class="news-content">
                        <p style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Загрузка новостей...</p>
                    </div>
                </div>
            `;
            
            // Имитация задержки для тестирования
            await new Promise(resolve => setTimeout(resolve, 300));
            
            let response;
            try {
                response = await fetch('news.json', {
                    cache: 'no-cache',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
            } catch (fetchError) {
                console.warn('Не удалось загрузить news.json, используем тестовые данные:', fetchError);
                
                // Используем тестовые данные если файл не найден
                const fallbackData = [
                    {
                        "title": "тестовые данные",
                        "icon": "fas fa-code",
                        "date": "11-11-11",
                        "content": "тестовые данные.",
                        "author": "тестовые данные",
                        "category": "тестовые данные"
                    },
                    {
                        "title": "тестовые данные",
                        "icon": "fas fa-code",
                        "date": "11-11-11",
                        "content": "тестовые данные.",
                        "author": "тестовые данные",
                        "category": "тестовые данные"
                    },
                ];
                
                displayNews(fallbackData, newsContainer, true);
                return;
            }
            
            const newsData = await response.json();
            displayNews(newsData, newsContainer, false);
            
        } catch (error) {
            console.error('Критическая ошибка загрузки новостей:', error);
            
            const newsContainer = document.getElementById('newsContainer');
            if (newsContainer) {
                newsContainer.innerHTML = `
                    <div class="news-card">
                        <div class="news-header">
                            <h3><i class="fas fa-exclamation-triangle"></i> Ошибка загрузки</h3>
                        </div>
                        <div class="news-content">
                            <p>Не удалось загрузить новости. Попробуйте обновить страницу позже.</p>
                            <details style="margin-top: 10px;">
                                <summary style="cursor: pointer; color: var(--primary-color);">Технические детали</summary>
                                <p style="font-size: 0.8em; color: var(--text-muted);">Ошибка: ${error.message}</p>
                            </details>
                        </div>
                    </div>
                `;
            }
        } finally {
            // Останавливаем анимацию вращения
            if (DOM.refreshNewsBtn) {
                setTimeout(() => {
                    DOM.refreshNewsBtn.classList.remove('spinning');
                }, 500);
            }
            
            // Снимаем блокировку
            window.isLoadingNews = false;
        }
    }

    // Вспомогательная функция для отображения новостей
    function displayNews(newsData, container, isFallback = false) {
        // Очищаем контейнер
        container.innerHTML = '';
        
        // Проверяем, есть ли новости
        if (!newsData || newsData.length === 0) {
            container.innerHTML = `
                <div class="news-card">
                    <div class="news-header">
                        <h3><i class="fas fa-info-circle"></i> ${isFallback ? 'Тестовые данные' : 'Нет новостей'}</h3>
                    </div>
                    <div class="news-content">
                        <p>${isFallback ? 'Файл news.json не найден. Используются тестовые данные.' : 'В данный момент новостей нет. Следите за обновлениями!'}</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Сортируем новости по дате (новые сверху)
        const sortedNews = [...newsData].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Создаем карточки для каждой новости
        sortedNews.forEach(newsItem => {
            const newsCard = document.createElement('div');
            newsCard.className = 'news-card';
            
            // Форматируем дату для отображения
            let formattedDate;
            try {
                const dateObj = new Date(newsItem.date);
                formattedDate = dateObj.toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (dateError) {
                formattedDate = newsItem.date || 'Дата не указана';
            }
            
            // Определяем иконку
            const iconClass = newsItem.icon || getIconByCategory(newsItem.category);
            
            // Создаем HTML для карточки новости
            newsCard.innerHTML = `
                <div class="news-header">
                    <h3><i class="${iconClass}"></i>${newsItem.title || 'Без названия'}</h3>
                    <span class="news-date" title="${newsItem.date || ''}">${formattedDate}</span>
                </div>
                <div class="news-content">
                    <p>${newsItem.content || 'Содержание отсутствует'}</p>
                </div>
                <div class="news-footer">
                    <span class="news-author"><i class="fas fa-user"></i> ${newsItem.author || 'Неизвестно'}</span>
                    <span class="news-category">${newsItem.category || 'Общее'}</span>
                </div>
            `;
            
            container.appendChild(newsCard);
        });
        
        if (isFallback) {
            const warning = document.createElement('div');
            warning.className = 'news-card';
            warning.style.borderColor = '#FFD700';
            warning.innerHTML = `
                <div class="news-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> Внимание</h3>
                </div>
                <div class="news-content">
                    <p>Файл <code>news.json</code> не найден или недоступен. Отображаются тестовые данные.</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">
                        Убедитесь, что файл находится в правильной директории и имеет корректный формат JSON.
                    </p>
                </div>
            `;
            container.insertBefore(warning, container.firstChild);
        }
        
        console.log(`${isFallback ? 'Загружены тестовые' : 'Загружено'} ${sortedNews.length} новостей`);
    }

    // Функция для получения иконки по категории
    function getIconByCategory(category) {
        const iconMap = {
            'Разработка': 'fas fa-code',
            'Ивент': 'fas fa-calendar-alt',
            'Обновление': 'fas fa-sync-alt',
            'Важное': 'fas fa-exclamation-circle',
            'default': 'fas fa-newspaper'
        };
        
        return iconMap[category] || iconMap.default;
    }

    // ============================
    // УПРАВЛЕНИЕ КНОПКОЙ ОБНОВЛЕНИЯ
    // ============================
    
    function showRefreshButton() {
        if (DOM.refreshNewsBtn) {
            DOM.refreshNewsBtn.classList.add('show');
        }
    }
    
    function hideRefreshButton() {
        if (DOM.refreshNewsBtn) {
            DOM.refreshNewsBtn.classList.remove('show');
        }
    }
    
    function updateRefreshButtonPosition() {
        if (!DOM.refreshNewsBtn) return;
        
        // На десктопе с сайдбаром
        if (window.innerWidth > 992) {
            DOM.refreshNewsBtn.style.right = 'calc(20px + var(--sidebar-width))';
        } else {
            DOM.refreshNewsBtn.style.right = '20px';
        }
        
        // На мобилках с открытым меню
        if (window.innerWidth <= 992 && isMenuOpen) {
            DOM.refreshNewsBtn.style.right = 'calc(85% + 20px)';
        }
    }

    // ============================
    // ИНИЦИАЛИЗАЦИЯ ГРОМКОСТИ
    // ============================
    
    function initVolume() {
        // Загружаем сохраненную громкость из localStorage
        const savedVolume = localStorage.getItem('musicVolume');
        if (savedVolume !== null) {
            DOM.volumeSlider.value = savedVolume;
            DOM.volumeValue.textContent = `${savedVolume}%`;
            DOM.bgMusic.volume = savedVolume / 100;
            
            // Устанавливаем начальный прогресс для заполнителя
            updateSliderProgress(savedVolume);
        } else {
            // Устанавливаем громкость по умолчанию (50%)
            DOM.bgMusic.volume = 0.5;
            DOM.volumeSlider.value = 50;
            DOM.volumeValue.textContent = '50%';
            updateSliderProgress(50);
        }
        
        // Функция для обновления визуального прогресса слайдера
        function updateSliderProgress(value) {
            DOM.volumeSlider.style.setProperty('--slider-progress', `${value}%`);
        }
        
        // Настраиваем событие изменения громкости
        DOM.volumeSlider.addEventListener('input', function() {
            const volume = this.value / 100;
            DOM.bgMusic.volume = volume;
            DOM.volumeValue.textContent = `${this.value}%`;
            
            // Обновляем визуальный прогресс
            updateSliderProgress(this.value);
            
            // Сохраняем в localStorage
            localStorage.setItem('musicVolume', this.value);
            
            // Автоматически воспроизводим музыку при первом изменении громкости
            if (isFirstInteraction && DOM.bgMusic.paused) {
                isFirstInteraction = false;
                DOM.bgMusic.play()
                    .then(() => {
                        DOM.musicBtn.innerHTML = '<i class="fas fa-pause"></i><span>Выключить музыку</span>';
                        DOM.musicBtn.style.background = 'linear-gradient(135deg, #FF4444, #CC0000)';
                    })
                    .catch(error => {
                        console.log('Автовоспроизведение заблокировано. Нужно нажать кнопку музыки.');
                    });
            }
        });
        
        // Изменение громкости при загрузке музыки
        DOM.bgMusic.addEventListener('loadeddata', function() {
            const savedVolume = localStorage.getItem('musicVolume');
            if (savedVolume !== null) {
                DOM.bgMusic.volume = savedVolume / 100;
            }
        });
    }
    


















    // ============================
    // ОСНОВНЫЕ ФУНКЦИИ
    // ============================
    
    // УСТАНОВКА АКТИВНОГО РАЗДЕЛА
    function setActiveSection(targetId, forceReload = false) {
        // Если уже активна эта секция и не требуется принудительная перезагрузка
        const currentActive = document.querySelector('.section.active');
        if (currentActive && currentActive.id === targetId && !forceReload) {
            return; // Не делаем ничего, если уже на этой странице
        }
        
        // Убираем активные классы
        DOM.navLinks.forEach(link => link.classList.remove('active'));
        DOM.sections.forEach(section => section.classList.remove('active'));
        
        // Находим и активируем нужный раздел
        const targetLink = document.querySelector(`[data-target="${targetId}"]`);
        const targetSection = document.getElementById(targetId);
        
        if (targetLink) targetLink.classList.add('active');
        if (targetSection) targetSection.classList.add('active');
        
        // Управляем видимостью кнопки обновления
        if (targetId === 'news') {
            isNewsSectionActive = true;
            showRefreshButton();
        } else {
            isNewsSectionActive = false;
            hideRefreshButton();
        }
        
        // Закрываем меню на мобильных
        closeMobileMenu();
        
        // Если переключаемся на раздел новостей, загружаем их (только если нужно)
        if (targetId === 'news') {
            setTimeout(() => {
                // Проверяем, есть ли уже загруженные новости
                const newsContainer = document.getElementById('newsContainer');
                const hasNews = newsContainer && newsContainer.children.length > 0;
                
                if (!hasNews || forceReload) {
                    loadNews();
                }
            }, 100);
        }
    }

    // ОТКРЫТИЕ МОБИЛЬНОГО МЕНЮ
    function openMobileMenu() {
        if (!DOM.sidebar || !DOM.overlay) return;
        
        DOM.sidebar.classList.add('open');
        DOM.overlay.classList.add('active');
        isMenuOpen = true;
        
        // Меняем иконку
        if (mobileIcon) {
            mobileIcon.classList.remove('fa-bars');
            mobileIcon.classList.add('fa-times');
        }
        
        // Обновляем позицию кнопки обновления
        updateRefreshButtonPosition();
        
        // Блокируем скролл на основном контенте
        document.body.classList.add('menu-open');
        
        // Запоминаем позицию скролла для возврата
        if (!window.scrollPosition) {
            window.scrollPosition = window.scrollY;
        }
    }

    // ЗАКРЫТИЕ МОБИЛЬНОГО МЕНЮ
    function closeMobileMenu() {
        if (!DOM.sidebar || !DOM.overlay) return;
        
        DOM.sidebar.classList.remove('open');
        DOM.overlay.classList.remove('active');
        isMenuOpen = false;
        
        // Возвращаем иконку
        if (mobileIcon) {
            mobileIcon.classList.remove('fa-times');
            mobileIcon.classList.add('fa-bars');
        }
        
        // Обновляем позицию кнопки обновления
        updateRefreshButtonPosition();
        
        // Разблокируем скролл на основном контенте
        document.body.classList.remove('menu-open');
        
        // Возвращаем позицию скролла
        if (window.scrollPosition !== undefined) {
            window.scrollTo(0, window.scrollPosition);
            delete window.scrollPosition;
        }
    }
    
    // ПЕРЕКЛЮЧЕНИЕ МУЗЫКИ
    function toggleMusic() {
        if (!DOM.bgMusic || !DOM.musicBtn) return;
        
        if (DOM.bgMusic.paused) {
            DOM.bgMusic.play()
                .then(() => {
                    DOM.musicBtn.innerHTML = '<i class="fas fa-pause"></i><span>Выключить музыку</span>';
                    DOM.musicBtn.style.background = 'linear-gradient(135deg, #FF4444, #CC0000)';
                    isFirstInteraction = false;
                })
                .catch((error) => {
                    console.error('Ошибка воспроизведения:', error);
                    alert('Нажмите "Включить музыку" еще раз для воспроизведения');
                });
        } else {
            DOM.bgMusic.pause();
            DOM.musicBtn.innerHTML = '<i class="fas fa-music"></i><span>Включить музыку</span>';
            DOM.musicBtn.style.background = 'linear-gradient(135deg, var(--accent-color), var(--accent-dark))';
        }
    }
    
    // ПАРАЛЛАКС ЭФФЕКТ ДЛЯ СЕТЧАТОГО ФОНА
    function updateParallax() {
        const bgGrid = document.querySelector('.bg-grid');
        if (!bgGrid) return;
        
        const scrollY = window.scrollY;
        const speed = 0.5;
        bgGrid.style.backgroundPosition = `0 ${scrollY * speed}px, 20px ${20 + scrollY * speed}px`;
    }
    
    // СОЗДАНИЕ КУБИКОВ В ФУТЕРЕ
    function createFooterCubes() {
        if (!DOM.footerCubes) return;
        
        // Очищаем предыдущие кубики
        DOM.footerCubes.innerHTML = '';
        
        // Создаем 5-10 случайных кубиков
        const cubeCount = Math.floor(Math.random() * 6) + 5;
        const colors = ['#00FF00', '#FFD700', '#FF4500', '#00FFFF', '#FF00FF'];
        
        for (let i = 0; i < cubeCount; i++) {
            const cube = document.createElement('div');
            cube.className = 'cube-in-footer';
            
            // Случайные параметры
            const size = Math.floor(Math.random() * 15) + 15;
            const top = Math.random() * 80;
            const speed = Math.random() * 20 + 30;
            const delay = Math.random() * 10;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Применяем стили
            cube.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                top: ${top}%;
                animation-duration: ${speed}s;
                animation-delay: -${delay}s;
                background: ${color};
            `;
            
            DOM.footerCubes.appendChild(cube);
        }
    }
    

    // ОБРАБОТКА ИЗМЕНЕНИЯ РАЗМЕРА ОКНА
    function handleResize() {
        // На десктопе всегда закрываем меню
        if (window.innerWidth > 992) {
            // Сбрасываем состояние меню на десктопе
            if (isMenuOpen) {
                closeMobileMenu();
            }
        } else {
            // На мобильных устройствах проверяем, нужно ли корректировать высоту сайдбара
            const sidebar = DOM.sidebar;
            if (sidebar && sidebar.classList.contains('open')) {
                // Принудительно устанавливаем высоту сайдбара равной высоте окна
                sidebar.style.height = '100vh';
            }
        }
        
        // Обновляем кубики в футере
        createFooterCubes();
        
        // Обновляем позицию кнопки обновления
        updateRefreshButtonPosition();
    }
    
    // ОБНОВЛЕНИЕ АКТИВНОГО РАЗДЕЛА ПРИ СКРОЛЛЕ
    function updateActiveOnScroll() {
        if (isMenuOpen) return; // Не обновляем при открытом меню
        
        const scrollPosition = window.scrollY + 100;
        let foundActive = false;
        
        DOM.sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                // Если это уже активная секция, не меняем
                if (!section.classList.contains('active')) {
                    setActiveSection(sectionId);
                }
                foundActive = true;
            }
        });
        
        // Если не нашли активную секцию (например, в самом начале или конце)
        if (!foundActive) {
            const firstSection = DOM.sections[0];
            if (firstSection && scrollPosition < firstSection.offsetTop) {
                // Мы в самом верху, устанавливаем первую секцию
                if (!firstSection.classList.contains('active')) {
                    setActiveSection(firstSection.id);
                }
            }
        }
    }





    // ============================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================

    // Throttle функция для ограничения частоты вызовов
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }










    // ============================
    // НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ
    // ============================
    
    // НАВИГАЦИЯ ПО ССЫЛКАМ
    DOM.navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            
            if (targetId) {
                // Проверяем, активна ли уже эта секция
                const targetSection = document.getElementById(targetId);
                const isAlreadyActive = targetSection && targetSection.classList.contains('active');
                
                setActiveSection(targetId, !isAlreadyActive);
                
                // Плавная прокрутка к секции
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop,
                        behavior: 'smooth'
                    });
                } else {
                    // Или к верху, если секция не найдена
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // КНОПКА МОБИЛЬНОГО МЕНЮ
    if (DOM.mobileToggle) {
        DOM.mobileToggle.addEventListener('click', function() {
            if (isMenuOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }
    
    // ЗАКРЫТИЕ МЕНЮ ПО КЛИКУ НА OVERLAY
    if (DOM.overlay) {
        DOM.overlay.addEventListener('click', closeMobileMenu);
    }
    
    // ЗАКРЫТИЕ МЕНЮ ПО КЛАВИШЕ ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMobileMenu();
        }
    });
    
    // УПРАВЛЕНИЕ МУЗЫКОЙ
    if (DOM.musicBtn) {
        DOM.musicBtn.addEventListener('click', toggleMusic);
    }
    
    // КНОПКА ОБНОВЛЕНИЯ НОВОСТЕЙ
    if (DOM.refreshNewsBtn) {
        DOM.refreshNewsBtn.addEventListener('click', function() {
            if (isNewsSectionActive) {
                // Принудительная перезагрузка новостей
                setActiveSection('news', true);
            } else {
                // Если не на странице новостей, переключаемся на нее
                setActiveSection('news');
                window.scrollTo({
                    top: document.getElementById('news').offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // ============================
    // ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ
    // ============================
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', throttle(function() {
        if (!isMenuOpen) {
            updateParallax();
            updateActiveOnScroll();
        }
    }, 100)); // Ограничиваем до 10 раз в секунду
    
    window.addEventListener('load', function() {
        createFooterCubes();
        handleResize(); // Инициализируем правильное состояние
        initVolume(); // Инициализируем громкость
        
        // Инициализируем кнопку обновления
        updateRefreshButtonPosition();
        
        // Загружаем новости при старте если активна вкладка новостей
        if (isNewsSectionActive) {
            loadNews();
        }
        
        // Добавляем класс для анимации загрузки
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);
    });
    
    // ============================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================
    
    updateParallax(); // Первоначальная установка параллакса
    handleResize();   // Проверяем начальный размер окна
    
    // Обновляем кубики в футере каждые 30 секунд
    // setInterval(createFooterCubes, 30000);
});
