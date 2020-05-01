using UnityEngine;

public class PlayerManager : MonoBehaviour {

    public GameObject explosionPrefab;
    public AudioClip explosionClip;

    public AudioSource audioSource;

    private float Speed = 0;
    private float Speed1 = 0;
    private Pair<Transform> playerTransform;

    private Transform connector;
    private Pair<float> scale;

    private Pair<float> currentX;
    private Pair<float> targetX;
    private float timeToMove;

    void Start() {
        playerTransform = new Pair<Transform>(transform.GetChild(0), transform.GetChild(1));
        connector = transform.GetChild(2);
        scale = new Pair<float>(0, 1);
        targetX = new Pair<float>(0, 0);
        currentX = new Pair<float>(0, 0);
        timeToMove = 0.1f * GameManager.Instance.Speed / 6.5f;

        Spawn();
    }

    void FixedUpdate() {
        if (playerTransform.Left.gameObject.activeSelf) {
            playerTransform.Left.position = new Vector3(currentX.Left, playerTransform.Left.position.y);
        }
        if (playerTransform.Right.gameObject.activeSelf) {
            playerTransform.Right.position = new Vector3(currentX.Right, playerTransform.Right.position.y);
        }
    }

    public void Move(InputManager.InputType input) {
        switch (input) {
            case InputManager.InputType.Left:
                targetX.Left = -3.2f;
                targetX.Right = -2.18f;
                break;

            case InputManager.InputType.Right:
                targetX.Left = 2.18f;
                targetX.Right = 3.2f;
                break;

            case InputManager.InputType.Both:
                targetX.Left = -3.2f;
                targetX.Right = 3.2f;
                break;

            case InputManager.InputType.None:
                targetX.Left = -0.48f;
                targetX.Right = 0.48f;
                break;
        }

        AdjustConnector();

        currentX.Left = Mathf.SmoothDamp(currentX.Left, targetX.Left, ref Speed, timeToMove);
        currentX.Right = Mathf.SmoothDamp(currentX.Right, targetX.Right, ref Speed1, timeToMove);
    }

    private void AdjustConnector() {
        float distance = playerTransform.Right.position.x - playerTransform.Left.position.x;
        scale.Left = 1.13f * (distance - 0.9f);
        scale.Right = 1f - (0.081f * distance);
        connector.localScale = new Vector2(scale.Left, scale.Right);
        connector.position = new Vector2((playerTransform.Right.position.x + playerTransform.Left.position.x) / 2, playerTransform.Left.position.y);
    }

    public void Dead(int index) {
        GameManager.CallGameOver();

        Kill();
    }

    public void Spawn() {
        if (playerTransform == null)
            return;

        playerTransform.Left.gameObject.SetActive(true);
        playerTransform.Right.gameObject.SetActive(true);

        connector.gameObject.SetActive(true);
    }

    public void Kill() {
        playerTransform.Left.gameObject.SetActive(false);
        playerTransform.Right.gameObject.SetActive(false);

        Instantiate(explosionPrefab, playerTransform.Left.position, Quaternion.identity);

        audioSource.PlayOneShot(explosionClip);

        connector.gameObject.SetActive(false);
    }

}
