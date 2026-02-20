# v0.1.0
# { "Depends": "py-genlayer:latest" }

from genlayer import *

class NeuralBound(gl.Contract):
    # Leaderboard Slots
    p1_name: str
    p1_score: u256
    p2_name: str
    p2_score: u256
    p3_name: str
    p3_score: u256
    
    # AI & Security
    latest_ai_note: str
    admin_key: str

    def __init__(self):
        # Initializing storage
        self.p1_name = "Void"
        self.p1_score = u256(0)
        self.p2_name = "Void"
        self.p2_score = u256(0)
        self.p3_name = "Void"
        self.p3_score = u256(0)
        
        self.latest_ai_note = "System Online. Waiting for racers..."
        self.admin_key = "NEURAL_PRO" # You can change this secret key

    @gl.public.write
    def update_leaderboard(self, slot: u256, name: str, score: u256, key: str):
        """
        Updates a specific slot if the admin key is correct.
        Logic handled by Game Frontend to decide which slot to call.
        """
        if key != self.admin_key:
            return "UNAUTHORIZED"

        # Direct writes based on slot number for maximum stability
        if slot == u256(1):
            self.p1_name = name
            self.p1_score = score
        elif slot == u256(2):
            self.p2_name = name
            self.p2_score = score
        elif slot == u256(3):
            self.p3_name = name
            self.p3_score = score
        
        # Trigger AI Analysis for the new record
        prompt = (f"In a neon racing game, {name} just scored {str(score)}. "
                  f"Write a very short, cool cyberpunk praise for them (max 10 words).")
        
        self.latest_ai_note = gl.nondet(lambda: gl.ai.generate_text(prompt))
        return "SUCCESS"

    @gl.public.view
    def get_full_stats(self) -> dict:
        """
        Returns all leaderboard data and AI notes in one call.
        """
        return {
            "top1": f"{self.p1_name}: {str(self.p1_score)}",
            "top2": f"{self.p2_name}: {str(self.p2_score)}",
            "top3": f"{self.p3_name}: {str(self.p3_score)}",
            "ai_voice": self.latest_ai_note
        }