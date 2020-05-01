using System;
using UnityEngine;

public class SpikeController : MonoBehaviour {

    private Rigidbody2D rigidBody;

    void Start() {
        try {
            rigidBody = transform.GetComponent<Rigidbody2D>();
        } catch (Exception e) {
            // Eat ?
        }
    }

    void FixedUpdate() {
        if (rigidBody != null) {
            rigidBody.velocity = Vector2.down * GameManager.Instance.Speed;
        }
    }

    void OnTriggerEnter2D(Collider2D other) {
        if (other.gameObject.tag == "PlayerLeft") {
            other.gameObject.transform.parent.SendMessage("Dead", -1);
        } else if (other.gameObject.tag == "PlayerRight") {
            other.gameObject.transform.parent.SendMessage("Dead", 1);
        }
    }

}
