package com.example.testdepense;


import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class Logup extends AppCompatActivity {

    EditText emailInput, passwordInput;
    Button registerButton;
    Database database;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_logup);

        database = new Database(this);

        emailInput = findViewById(R.id.editTextTextEmailAddress);
        passwordInput = findViewById(R.id.editTextTextPassword);
        registerButton = findViewById(R.id.buttonup);

        registerButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String email = emailInput.getText().toString();
                String password = passwordInput.getText().toString();

                if (email.isEmpty() || password.isEmpty()) {
                    Toast.makeText(Logup.this, "Tous les champs sont obligatoires", Toast.LENGTH_SHORT).show();
                } else {
                    // Vérifiez si l'e-mail est unique
                    boolean success = database.registerUser(email, password);
                    if (success) {
                        Toast.makeText(Logup.this, "Inscription réussie", Toast.LENGTH_SHORT).show();
                        finish(); // Retour à l'activité précédente (login)
                    } else {
                        Toast.makeText(Logup.this, "Cet e-mail est déjà utilisé", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        });
    }
}
