package com.example.testdepense;


import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class Login extends AppCompatActivity {

    EditText emailInput, passwordInput;
    Button loginButton, registerButton;
    Database database;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        database = new Database(this);

        emailInput = findViewById(R.id.editTextTextEmailAddress);
        passwordInput = findViewById(R.id.editTextTextPassword);
        loginButton = findViewById(R.id.button2);
        registerButton = findViewById(R.id.button3);

        loginButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String email = emailInput.getText().toString();
                String password = passwordInput.getText().toString();

                if (email.isEmpty() || password.isEmpty()) {
                    Toast.makeText(Login.this, "Tous les champs sont obligatoires", Toast.LENGTH_SHORT).show();
                } else {
                    boolean valid = database.checkUser(email, password);
                    if (valid) {
                        Toast.makeText(Login.this, "Connexion réussie", Toast.LENGTH_SHORT).show();
                        // Rediriger vers une nouvelle activité
                        Intent intent = new Intent(Login.this, Accueil.class);
                        startActivity(intent);
                        finish();
                    } else {
                        Toast.makeText(Login.this, "Identifiants incorrects", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        });

        registerButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Ouvrir l'activité d'inscription
                Intent intent = new Intent(Login.this, Logup.class);
                startActivity(intent);
            }
        });
    }
}
