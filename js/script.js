document.addEventListener('DOMContentLoaded', () => {
    // --- Global Variables (Simulated User Data & Appointments) ---
    // Users data structure:
    // { username, email, password, ownerName, usualVet, profilePic, pets: [{ name, photo }] }
    let users = JSON.parse(localStorage.getItem('registeredUsers')) || [];

    // All appointments (regardless of user) for the "Reportes" section
    let allAppointments = JSON.parse(localStorage.getItem('allVetAppointments')) || [];

    // Simulate initial appointments if none exist
    if (allAppointments.length === 0) {
        allAppointments = [
            {
                fichaNumber: 1001, ownerName: "Juan Perez", petName: "Max", vetName: "Dr. Ana Gómez",
                date: "26/05/2025", time: "10:00", symptoms: "Dolor en pata izquierda", bookedBy: "admin"
            },
            {
                fichaNumber: 1002, ownerName: "Maria Lopez", petName: "Luna", vetName: "Dr. Carlos Ruiz",
                date: "27/05/2025", time: "11:30", symptoms: "Tos persistente", bookedBy: "testuser"
            },
            {
                fichaNumber: 1003, ownerName: "Carlos Garcia", petName: "Rocky", vetName: "Dra. Laura Pérez",
                date: "28/05/2025", time: "09:00", symptoms: "Fiebre y letargo", bookedBy: "admin"
            },
            {
                fichaNumber: 1004, ownerName: "Ana Rodríguez", petName: "Mia", vetName: "Dr. Ana Gómez",
                date: "29/05/2025", time: "14:00", symptoms: "Revisión general", bookedBy: "testuser"
            }
        ];
        localStorage.setItem('allVetAppointments', JSON.stringify(allAppointments));
    }

    let loggedInUser = null; // Will store the full user object once logged in

    // --- Utility Functions ---

    /**
     * Toggles the visibility of a password input field.
     * @param {HTMLInputElement} passwordInput - The password input element.
     * @param {HTMLButtonElement} toggleButton - The button to toggle visibility.
     */
    function togglePasswordVisibility(passwordInput, toggleButton) {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleButton.querySelector('i').classList.toggle('bi-eye');
        toggleButton.querySelector('i').classList.toggle('bi-eye-slash');
    }

    /**
     * Displays a message on the UI.
     * @param {HTMLElement} messageElement - The element where the message will be displayed.
     * @param {string} message - The message text.
     * @param {string} type - 'success', 'danger', or 'info' for Bootstrap alert classes.
     */
    function displayMessage(messageElement, message, type) {
        messageElement.innerHTML = `<div class="alert alert-${type}" role="alert">${message}</div>`;
        setTimeout(() => {
            messageElement.innerHTML = ''; // Clear message after 3 seconds
        }, 3000);
    }

    /**
     * Validates a password against specific rules and updates feedback.
     * @param {string} password - The password string to validate.
     * @param {HTMLElement} feedbackElement - The div containing feedback elements.
     * @returns {boolean} - True if password meets all rules, false otherwise.
     */
    function validatePassword(password, feedbackElement) {
        // Minimum 8 characters
        const hasMinEightChars = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        const checks = [
            { id: 'length', condition: hasMinEightChars, text: 'Mínimo 8 caracteres' },
            { id: 'uppercase', condition: hasUppercase, text: 'Al menos una mayúscula' },
            { id: 'number', condition: hasNumber, text: 'Al menos un número' },
            { id: 'symbol', condition: hasSymbol, text: 'Al menos un símbolo' }
        ];

        feedbackElement.innerHTML = ''; // Clear previous feedback
        checks.forEach(check => {
            const iconClass = check.condition ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger';
            feedbackElement.innerHTML += `
                <div class="text-muted small">
                    <i class="bi ${iconClass} me-1"></i>${check.text}
                </div>
            `;
        });

        return hasMinEightChars && hasUppercase && hasNumber && hasSymbol;
    }


    // --- Module: User Account Creation and Login (index.html specific) ---

    const loginForm = document.getElementById('loginForm');
    const loginUsernameInput = document.getElementById('loginUsername');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginMessage = document.getElementById('loginMessage');
    const toggleLoginPasswordButton = document.getElementById('toggleLoginPassword');

    const registerForm = document.getElementById('registerForm');
    const regUsernameInput = document.getElementById('regUsername');
    const regEmailInput = document.getElementById('regEmail');
    const regPasswordInput = document.getElementById('regPassword');
    const registerMessage = document.getElementById('registerMessage');
    const toggleRegisterPasswordButton = document.getElementById('toggleRegisterPassword');
    const regPasswordFeedback = document.getElementById('regPasswordFeedback');

    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const recoveryEmailInput = document.getElementById('recoveryEmail');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const recoveryMessage = document.getElementById('recoveryMessage');
    const toggleNewPasswordButton = document.getElementById('toggleNewPassword');
    const toggleConfirmNewPasswordButton = document.getElementById('toggleConfirmNewPassword');
    const newPasswordFeedback = document.getElementById('newPasswordFeedback');

    // Check for logout message on index.html load
    const logoutSuccess = sessionStorage.getItem('logoutSuccess');
    if (logoutSuccess) {
        displayMessage(loginMessage, '¡Gracias por confiar en VetApp! Esperamos verte de nuevo.', 'info');
        sessionStorage.removeItem('logoutSuccess'); // Clear the flag
    }


    // Attach event listeners only if elements exist (i.e., on index.html)
    if (loginForm) {
        // Toggle password visibility for Login form
        toggleLoginPasswordButton.addEventListener('click', () => {
            togglePasswordVisibility(loginPasswordInput, toggleLoginPasswordButton);
        });

        // Toggle password visibility for Register form
        toggleRegisterPasswordButton.addEventListener('click', () => {
            togglePasswordVisibility(regPasswordInput, toggleRegisterPasswordButton);
        });

        // Real-time password feedback for registration
        regPasswordInput.addEventListener('input', () => {
            validatePassword(regPasswordInput.value, regPasswordFeedback);
        });

        // Register Form Submission
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = regUsernameInput.value.trim();
            const email = regEmailInput.value.trim();
            const password = regPasswordInput.value;

            // Basic email format validation
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                displayMessage(registerMessage, 'Por favor, ingrese un correo electrónico válido.', 'danger');
                return;
            }

            if (!validatePassword(password, regPasswordFeedback)) {
                displayMessage(registerMessage, 'La contraseña no cumple con todos los requisitos.', 'danger');
                return;
            }

            // Check if username or email already exists (case-insensitive for username/email)
            const userExists = users.some(user =>
                user.username.toLowerCase() === username.toLowerCase() || user.email.toLowerCase() === email.toLowerCase()
            );

            if (userExists) {
                displayMessage(registerMessage, 'El nombre de usuario o correo electrónico ya está registrado.', 'danger');
                return;
            }

            // Initialize user with default profile data
            const newUser = {
                username,
                email,
                password, // In a real app, hash the password!
                ownerName: '', // Can be set later in 'Mis Datos'
                usualVet: '',
                profilePic: 'https://via.placeholder.com/150/007bff/FFFFFF?text=Tu+Foto', // Default profile pic
                pets: [] // Array to store pet objects: { name, photo }
            };
            users.push(newUser);
            localStorage.setItem('registeredUsers', JSON.stringify(users));
            displayMessage(registerMessage, '¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.', 'success');
            registerForm.reset(); // Clear the form
            regPasswordFeedback.innerHTML = `
                <div class="text-muted"><i class="bi bi-x-circle-fill text-danger me-1"></i>Mínimo 8 caracteres</div>
                <div class="text-muted"><i class="bi bi-x-circle-fill text-danger me-1"></i>Al menos una mayúscula</div>
                <div class="text-muted"><i class="bi bi-x-circle-fill text-danger me-1"></i>Al menos un número</div>
                <div class="text-muted"><i class="bi bi-x-circle-fill text-danger me-1"></i>Al menos un símbolo</div>
            `; // Reset feedback
            // Switch to login tab after successful registration
            const loginTab = new bootstrap.Tab(document.getElementById('login-tab'));
            loginTab.show();
        });

        // Login Form Submission
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = loginUsernameInput.value.trim();
            const password = loginPasswordInput.value;

            const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password); // Password comparison needs hashing in real app

            if (user) {
                loggedInUser = user; // Store the full user object
                sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser)); // Store logged-in user in sessionStorage
                displayMessage(loginMessage, 'Inicio de sesión exitoso. Redirigiendo...', 'success');
                setTimeout(() => {
                    window.location.href = 'main.html'; // Redirect to main page
                }, 1000);
            } else {
                displayMessage(loginMessage, 'Usuario o contraseña incorrectos.', 'danger');
            }
        });

        // --- Password Recovery Modal Logic ---

        // Toggle password visibility for New Password in recovery
        toggleNewPasswordButton.addEventListener('click', () => {
            togglePasswordVisibility(newPasswordInput, toggleNewPasswordButton);
        });

        // Toggle password visibility for Confirm New Password in recovery
        toggleConfirmNewPasswordButton.addEventListener('click', () => {
            togglePasswordVisibility(confirmNewPasswordInput, toggleConfirmNewPasswordButton);
        });

        // Real-time password feedback for new password in recovery
        newPasswordInput.addEventListener('input', () => {
            validatePassword(newPasswordInput.value, newPasswordFeedback);
        });

        forgotPasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const recoveryEmail = recoveryEmailInput.value.trim();
            const newPassword = newPasswordInput.value;
            const confirmNewPassword = confirmNewPasswordInput.value;

            const userIndex = users.findIndex(u => u.email.toLowerCase() === recoveryEmail.toLowerCase());

            if (userIndex === -1) {
                displayMessage(recoveryMessage, 'El correo electrónico no está registrado.', 'danger');
                return;
            }

            if (!validatePassword(newPassword, newPasswordFeedback)) {
                displayMessage(recoveryMessage, 'La nueva contraseña no cumple con todos los requisitos.', 'danger');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                displayMessage(recoveryMessage, 'Las nuevas contraseñas no coinciden.', 'danger');
                return;
            }

            // Update password (in a real app, this would be a secure backend operation)
            users[userIndex].password = newPassword;
            localStorage.setItem('registeredUsers', JSON.stringify(users));
            displayMessage(recoveryMessage, 'Contraseña actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.', 'success');
            forgotPasswordForm.reset();
            newPasswordFeedback.innerHTML = `
                <div class="text-muted"><i class="bi bi-x-circle-fill text-danger me-1"></i>Mínimo 8 caracteres</div>
                <div class="text-muted"><i class="bi bi-x-circle-fill text-danger me-1"></i>Al menos una mayúscula</div>
                <div class="text-muted"><i class="bi bi-x-circle-fill text-danger me-1"></i>Al menos un número</div>
                <div class="text-muted"><i class="bi bi-x-circle-fill text-danger me-1"></i>Al menos un símbolo</div>
            `; // Reset feedback
            // Optionally close modal after success
            const forgotPasswordModal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
            if (forgotPasswordModal) {
                setTimeout(() => {
                    forgotPasswordModal.hide();
                }, 2000); // Hide after 2 seconds
            }
        });
    }


    // --- Module: Main Application Page (main.html specific) ---

    const appointmentForm = document.getElementById('appointmentForm');

    // Check if user is logged in on main.html, otherwise redirect
    if (appointmentForm) {
        loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
        if (!loggedInUser) {
            window.location.href = 'index.html';
            return; // Stop script execution if not logged in
        }

        // Elements for "Ver mis datos" tab
        const profileUsernameInput = document.getElementById('profileUsername'); // Changed ID to reflect input
        const profileEmailInput = document.getElementById('profileEmail');       // Changed ID to reflect input
        const profileOwnerNameInput = document.getElementById('profileOwnerName');
        const profileUsualVetSelect = document.getElementById('profileUsualVet');
        const numCachorrosInput = document.getElementById('numCachorros');
        const profilePic = document.getElementById('profilePic');
        const profilePicUpload = document.getElementById('profilePicUpload');
        const changeProfilePicBtn = document.getElementById('changeProfilePicBtn');
        const profileForm = document.getElementById('profileForm');
        const profileMessage = document.getElementById('profileMessage');
        const petsContainer = document.getElementById('petsContainer');
        const addPetBtn = document.getElementById('addPetBtn');
        const noPetsMessage = document.getElementById('noPetsMessage');

        // Elements for "Reportes" tab
        const reportesTabBtn = document.getElementById('reportes-tab');
        const appointmentsReportDiv = document.getElementById('appointmentsReport');
        const noReportsMessage = document.getElementById('noReportsMessage');

        // Elements for "Cita Médica" tab
        const ownerNameInput = document.getElementById('ownerName');
        const petNameInput = document.getElementById('petName');
        const vetNameSelect = document.getElementById('vetName');
        const appointmentDateInput = document.getElementById('appointmentDate');
        const appointmentTimeInput = document.getElementById('appointmentTime');
        const symptomsInput = document.getElementById('symptoms');
        const appointmentConfirmationDiv = document.getElementById('appointmentConfirmation');
        const printAppointmentBtn = document.getElementById('printAppointmentBtn'); // New print button

        const confOwnerName = document.getElementById('confOwnerName');
        const confPetName = document.getElementById('confPetName');
        const confVetName = document.getElementById('confVetName');
        const confAppointmentDate = document.getElementById('confAppointmentDate');
        const confAppointmentTime = document.getElementById('confAppointmentTime');
        const confSymptoms = document.getElementById('confSymptoms');
        const fichaNumberSpan = document.getElementById('fichaNumber');
        const mailDateSpan = document.getElementById('mailDate');
        const mailTimeSpan = document.getElementById('mailTime');
        const mailVetNameSpan = document.getElementById('mailVetName');
        const logoutButton = document.getElementById('logoutButton');

        // --- "Ver mis datos" (Profile) Functionality ---

        function loadUserProfile() {
            profileUsernameInput.value = loggedInUser.username;
            profileEmailInput.value = loggedInUser.email;
            profileOwnerNameInput.value = loggedInUser.ownerName || '';
            profileUsualVetSelect.value = loggedInUser.usualVet || '';
            profilePic.src = loggedInUser.profilePic || 'https://via.placeholder.com/150/007bff/FFFFFF?text=Tu+Foto';
            numCachorrosInput.value = (loggedInUser.pets ? loggedInUser.pets.length : 0);
            renderPets();
        }

        function renderPets() {
            petsContainer.innerHTML = ''; // Clear previous pets
            if (loggedInUser.pets && loggedInUser.pets.length > 0) {
                noPetsMessage.style.display = 'none';
                loggedInUser.pets.forEach((pet, index) => {
                    const petCard = document.createElement('div');
                    petCard.classList.add('col-6', 'col-md-4', 'col-lg-3', 'mb-3'); // Adjust grid for smaller cards
                    petCard.innerHTML = `
                        <div class="card h-100">
                            <img src="${pet.photo || 'https://via.placeholder.com/100/FFC107/FFFFFF?text=Mascota'}" class="card-img-top" alt="${pet.name}" style="height: 100px; object-fit: cover;">
                            <div class="card-body p-2">
                                <h6 class="card-title text-center mb-1 text-truncate">${pet.name}</h6>
                                <div class="d-grid gap-2">
                                    <button type="button" class="btn btn-danger btn-sm" data-pet-index="${index}"><i class="bi bi-trash"></i> Eliminar</button>
                                </div>
                            </div>
                        </div>
                    `;
                    petsContainer.appendChild(petCard);
                });
            } else {
                noPetsMessage.style.display = 'block';
            }
        }

        // Event listener for "Ver mis datos" tab activation
        document.getElementById('misDatos-tab').addEventListener('shown.bs.tab', loadUserProfile);

        // Handle profile picture change
        changeProfilePicBtn.addEventListener('click', () => {
            profilePicUpload.click(); // Trigger file input click
        });

        profilePicUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    profilePic.src = e.target.result; // Update image preview
                    loggedInUser.profilePic = e.target.result; // Store base64 string
                };
                reader.readAsDataURL(file); // Convert image to Base64
            }
        });

        // Add New Pet
        addPetBtn.addEventListener('click', () => {
            const petName = prompt('Ingrese el nombre de la nueva mascota:');
            if (petName && petName.trim() !== '') {
                const petPhoto = prompt('Ingrese la URL de la foto de la mascota (o déjelo vacío para la predeterminada):');
                if (!loggedInUser.pets) {
                    loggedInUser.pets = [];
                }
                loggedInUser.pets.push({ name: petName.trim(), photo: petPhoto || 'https://via.placeholder.com/100/FFC107/FFFFFF?text=Mascota' });
                numCachorrosInput.value = loggedInUser.pets.length; // Update count
                renderPets(); // Re-render pets list
                displayMessage(profileMessage, 'Mascota añadida exitosamente.', 'success');
            } else if (petName !== null) { // If user clicked cancel, petName is null
                 displayMessage(profileMessage, 'El nombre de la mascota no puede estar vacío.', 'danger');
            }
        });

        // Delegate click handler for removing pets (since cards are dynamic)
        petsContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.textContent.includes('Eliminar')) {
                const petIndex = parseInt(e.target.dataset.petIndex);
                if (confirm(`¿Está seguro de que desea eliminar a ${loggedInUser.pets[petIndex].name}?`)) {
                    loggedInUser.pets.splice(petIndex, 1);
                    numCachorrosInput.value = loggedInUser.pets.length; // Update count
                    renderPets(); // Re-render pets list
                    displayMessage(profileMessage, 'Mascota eliminada.', 'info');
                }
            }
        });


        // Save Profile Changes
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loggedInUser.ownerName = profileOwnerNameInput.value.trim();
            loggedInUser.usualVet = profileUsualVetSelect.value;
            loggedInUser.pets = loggedInUser.pets || []; // Ensure pets array exists
            
            // Update the number of puppies based on actual pets
            numCachorrosInput.value = loggedInUser.pets.length;


            // Find the user in the global users array and update their data
            const userIndex = users.findIndex(u => u.username === loggedInUser.username);
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...loggedInUser }; // Merge changes
                localStorage.setItem('registeredUsers', JSON.stringify(users));
                sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser)); // Update session storage too
                displayMessage(profileMessage, 'Perfil actualizado exitosamente.', 'success');
            } else {
                displayMessage(profileMessage, 'Error al guardar perfil. Usuario no encontrado.', 'danger');
            }
        });


        // --- "Reportes" (All Appointments) Functionality ---

        function renderAppointmentsReport() {
            appointmentsReportDiv.innerHTML = ''; // Clear previous content
            if (allAppointments.length === 0) {
                noReportsMessage.style.display = 'block';
            } else {
                noReportsMessage.style.display = 'none';
                // Sort appointments by date and time
                const sortedAppointments = [...allAppointments].sort((a, b) => {
                    const dateA = new Date(a.date.split('/').reverse().join('-') + 'T' + a.time);
                    const dateB = new Date(b.date.split('/').reverse().join('-') + 'T' + b.time);
                    return dateA - dateB;
                });

                sortedAppointments.forEach((appointment) => {
                    const appointmentCard = document.createElement('div');
                    appointmentCard.classList.add('col-md-6', 'col-lg-4', 'mb-3'); // Bootstrap grid
                    appointmentCard.innerHTML = `
                        <div class="appointment-card shadow-sm h-100">
                            <h6>Cita #${appointment.fichaNumber}</h6>
                            <p><strong>Fecha:</strong> ${appointment.date}</p>
                            <p><strong>Hora:</strong> ${appointment.time}</p>
                            <p><strong>Dueño:</strong> ${appointment.ownerName}</p>
                            <p><strong>Mascota:</strong> ${appointment.petName}</p>
                            <p><strong>Veterinario:</strong> ${appointment.vetName}</p>
                            <p><strong>Síntomas:</strong> ${appointment.symptoms}</p>
                            <p><small class="text-muted">Agendado por: ${appointment.bookedBy || 'N/A'}</small></p>
                        </div>
                    `;
                    appointmentsReportDiv.appendChild(appointmentCard);
                });
            }
        }

        // Event listener for when the Reportes tab is shown
        reportesTabBtn.addEventListener('shown.bs.tab', renderAppointmentsReport);

        // --- Logout Functionality ---
        logoutButton.addEventListener('click', () => {
            sessionStorage.setItem('logoutSuccess', 'true'); // Set a flag
            sessionStorage.removeItem('loggedInUser'); // Clear logged-in user
            window.location.href = 'index.html'; // Redirect to login page
        });

        // --- "Cita Médica" Form Submission ---
        appointmentForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const ownerName = ownerNameInput.value.trim();
            const petName = petNameInput.value.trim();
            const vetName = vetNameSelect.value;
            const date = appointmentDateInput.value;
            const time = appointmentTimeInput.value;
            const symptoms = symptomsInput.value.trim();

            // Simple validation (can be enhanced)
            if (!ownerName || !petName || !vetName || !date || !time || !symptoms) {
                alert('Por favor, complete todos los campos requeridos.');
                return;
            }

            // Display confirmed data
            confOwnerName.textContent = ownerName;
            confPetName.textContent = petName;
            confVetName.textContent = vetName;
            // Format date for display
            // Make sure date is formatted consistently before storing/displaying
            const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('es-ES');
            confAppointmentDate.textContent = new Date(date + 'T' + time).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            confAppointmentTime.textContent = time;
            confSymptoms.textContent = symptoms;

            // Simulate email confirmation
            const fichaNumber = Math.floor(1000 + Math.random() * 9000); // Generate a random 4-digit ficha number
            fichaNumberSpan.textContent = fichaNumber;
            mailDateSpan.textContent = formattedDate;
            mailTimeSpan.textContent = time;
            mailVetNameSpan.textContent = vetName;

            appointmentConfirmationDiv.style.display = 'block';

            // Store the appointment in allAppointments for reports
            const newAppointment = {
                fichaNumber: fichaNumber,
                ownerName: ownerName,
                petName: petName,
                vetName: vetName,
                date: formattedDate, // Store formatted date
                time: time,
                symptoms: symptoms,
                bookedBy: loggedInUser.username // Track who booked it
            };
            allAppointments.push(newAppointment);
            localStorage.setItem('allVetAppointments', JSON.stringify(allAppointments));


            // Simulate sending email (console log for demonstration)
            console.log(`--- SIMULACIÓN DE ENVÍO DE CORREO ---`);
            console.log(`Para: ${loggedInUser.email}`);
            console.log(`Asunto: Confirmación de Cita Veterinaria - #${fichaNumber}`);
            console.log(`Cuerpo del Correo:`);
            console.log(`  Estimado(a) ${loggedInUser.username},`);
            console.log(`  Su cita para ${petName} (dueño: ${ownerName}) ha sido confirmada.`);
            console.log(`  Número de ficha: ${fichaNumber}`);
            console.log(`  Fecha: ${formattedDate}`);
            console.log(`  Hora: ${time}`);
            console.log(`  Veterinario Asignado: ${vetName}`);
            console.log(`  Síntomas reportados: ${symptoms}`);
            console.log(`  Agradecemos su preferencia.`);
            console.log(`-----------------------------------`);

            // Clear the form after submission
            appointmentForm.reset();
        });

        // --- Print Appointment to PDF Functionality ---
        printAppointmentBtn.addEventListener('click', () => {
            const printArea = document.getElementById('printAppointmentArea');

            // Populate the hidden print area with current confirmation details
            document.getElementById('printFichaNumber').textContent = fichaNumberSpan.textContent;
            document.getElementById('printAppointmentDate').textContent = confAppointmentDate.textContent;
            document.getElementById('printAppointmentTime').textContent = confAppointmentTime.textContent;
            document.getElementById('printVetName').textContent = confVetName.textContent;
            document.getElementById('printOwnerName').textContent = confOwnerName.textContent;
            document.getElementById('printPetName').textContent = confPetName.textContent;
            document.getElementById('printSymptoms').textContent = confSymptoms.textContent;

            // Set the print area to visible for printing, then hide it again
            const originalDisplay = printArea.style.display;
            printArea.style.display = 'block'; // Make it visible for print
            window.print(); // Trigger browser print dialog
            printArea.style.display = originalDisplay; // Hide it after print command

        });


        // Initialize reports and user profile when main.html loads for the first time
        loadUserProfile();
        renderAppointmentsReport(); // Also render on initial load of main.html
    }
});