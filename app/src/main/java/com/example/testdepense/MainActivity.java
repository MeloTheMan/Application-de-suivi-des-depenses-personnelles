package com.example.testdepense;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.ImageView;


import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {

    private static int splash_screen = 5000;
    Animation topAnim,bottomAnim;
    ImageView image1;
    ImageView image2;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
//animation
            topAnim= AnimationUtils.loadAnimation(this,R.anim.top_animation);
            bottomAnim= AnimationUtils.loadAnimation(this,R.anim.bottom_animation);

          image1=findViewById(R.id.imageView6);
            image2=findViewById(R.id.imageView8);

            image1.setAnimation(bottomAnim);
            image2.setAnimation(topAnim);

            new Handler().postDelayed(new Runnable() {
                @Override
                public void run() {
                    Intent intent  = new Intent(MainActivity.this,login.class);
                    startActivity(intent);
                    finish();




                }
            },splash_screen);







   }
}